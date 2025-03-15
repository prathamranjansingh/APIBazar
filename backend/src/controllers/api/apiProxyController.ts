import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { PrismaClient, Prisma, Api, Endpoint } from "@prisma/client";
import { logger } from "../../utils/logger";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { performance } from "perf_hooks";
import {
  isRedisAvailable,
  incrementApiUsage,
  cacheData,
  getCachedData,
  CACHE_TTL,
} from "../../config/redis";
import { dynamicApiLimiter } from "../../middlewares/rateLimiter";
import crypto from "crypto";

const prisma = new PrismaClient();

// Define interface for cached response
interface CachedResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

/**
 * Generate a cache key for an API request
 */
const generateCacheKey = (
  apiId: string,
  method: string,
  path: string,
  queryParams: Record<string, any>,
  body: any
): string => {
  const hash = crypto.createHash("md5");
  hash.update(`${apiId}:${method}:${path}`);
  hash.update(JSON.stringify(queryParams || {}));
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && body) {
    hash.update(JSON.stringify(body));
  }
  return `api-response:${hash.digest("hex")}`;
};

/**
 * Determine if a response should be cached based on method and status
 */
const shouldCacheResponse = (method: string, status: number): boolean => {
  return method.toUpperCase() === "GET" && status >= 200 && status < 300;
};

/**
 * Determine appropriate cache TTL based on API and endpoint
 */
const getCacheTTL = (api: Api, endpoint: Endpoint | null): number => {
  if (endpoint?.cacheTTL) return endpoint.cacheTTL as number;
  if ((api as any).cacheTTL) return (api as any).cacheTTL;
  return CACHE_TTL.MEDIUM;
};

/**
 * Proxy requests to third-party APIs with caching, authentication, and rate limiting
 */
export const proxyApiRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const startTime = performance.now();
  try {
    if (!req.auth?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { apiId, endpointPath } = req.params;
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Find the API and check if user has purchased it
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Check if user has access to this API
    let canAccess = api.ownerId === user.id;
    if (!canAccess) {
      const apiPurchase = await prisma.purchasedAPI.findUnique({
        where: { userId_apiId: { userId: user.id, apiId } },
      });
      canAccess = !!apiPurchase;
    }

    if (!canAccess) {
      res.status(403).json({ error: "You don't have access to this API" });
      return;
    }

    // Find the matching endpoint by path
    const endpoint = api.endpoints.find((e) => {
      const pathPattern = e.path.replace(/\{([^}]+)\}/g, "([^/]+)");
      const regex = new RegExp(`^${pathPattern}$`);
      return (
        e.method.toUpperCase() === req.method.toUpperCase() &&
        regex.test(endpointPath)
      );
    });

    if (!endpoint) {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }

    // Apply rate limiting for this specific endpoint
    const rateLimitKey = `${user.id}:${apiId}:${endpoint.id}`;
    const rateLimit = endpoint.rateLimit || api.rateLimit || 60; // Default to 60 req/min

    try {
      const limiter = dynamicApiLimiter(rateLimitKey, rateLimit);
      await limiter(req, res, () => {
        /* Continue with request */
      });
    } catch (rateLimitError) {
      logger.error("Rate limit error:", rateLimitError);
    }

    // Parse path parameters from the endpoint path
    const pathParams: Record<string, string> = {};
    const endpointPathParts = endpoint.path.split("/");
    const actualPathParts = endpointPath.split("/");

    for (let i = 0; i < endpointPathParts.length; i++) {
      if (
        endpointPathParts[i].startsWith("{") &&
        endpointPathParts[i].endsWith("}")
      ) {
        const paramName = endpointPathParts[i].slice(1, -1);
        pathParams[paramName] = actualPathParts[i];
      }
    }

    // Get the API key for this user and API
    const apiKey = await prisma.apiKey.findFirst({
      where: { userId: user.id, apiId },
    });

    // Construct target URL
    let targetUrl = api.baseUrl || "";
    let processedPath = endpoint.path;

    for (const [key, value] of Object.entries(pathParams)) {
      processedPath = processedPath.replace(`{${key}}`, value);
    }

    targetUrl += processedPath;

    // Generate a cache key for this request
    const cacheKey = generateCacheKey(
      apiId,
      req.method,
      processedPath,
      req.query as Record<string, any>,
      req.body
    );

    // Try to get response from cache for GET requests
    if (req.method.toUpperCase() === "GET" && isRedisAvailable()) {
      const cachedResponse = await getCachedData<CachedResponse>(cacheKey);
      if (cachedResponse) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        res.set({
          "X-APIBazar-Cache": "HIT",
          "X-APIBazar-Response-Time": `${duration}ms`,
        });

        res.status(cachedResponse.status);
        for (const [key, value] of Object.entries(cachedResponse.headers || {})) {
          if (
            !["content-length", "connection", "transfer-encoding"].includes(
              key.toLowerCase()
            )
          ) {
            res.setHeader(key, value);
          }
        }

        return res.send(cachedResponse.data);
      }
    }

    // Prepare request configuration
    const config: AxiosRequestConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...(req.headers as Record<string, string>),
      },
      params: req.query,
      data: req.body,
      validateStatus: () => true, // Accept any status
      timeout: 30000, // 30 seconds timeout
    };

    // Add host header based on URL
    if (config.headers) {
      config.headers["host"] = new URL(targetUrl).host;
    }

    // Remove headers that should not be forwarded
    if (config.headers) {
      ["host", "connection", "authorization"].forEach((header) => {
        if (config.headers) {
          delete config.headers[header];
        }
      });
    }

    // Add API key to request if available
    if (apiKey && config.headers) {
      config.headers["x-api-key"] = apiKey.key;
    }

    // Execute the request
    const response = await axios(config);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Cache the response if it's cacheable
    if (shouldCacheResponse(req.method, response.status) && isRedisAvailable()) {
      const ttl = getCacheTTL(api, endpoint);
      const cacheableResponse: CachedResponse = {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
      cacheData(cacheKey, cacheableResponse, ttl).catch((err) => {
        logger.error(`Failed to cache API response: ${err}`);
      });
    }

    // Track API usage asynchronously
    Promise.all([
      // Update database analytics
      prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          totalRequests: { increment: 1 },
          ...(api.price ? { revenue: { increment: api.price } } : {}),
        } as Prisma.ApiAnalyticsUpdateInput,
      }),
      // Track in Redis if available (for real-time analytics)
      isRedisAvailable() ? incrementApiUsage(apiId, user.id) : Promise.resolve(false),
    ]).catch((err) => {
      logger.error("Failed to track API usage:", err);
    });

    // Forward the response status, headers, and body
    res.status(response.status);
    for (const [key, value] of Object.entries(response.headers)) {
      if (
        !["content-length", "connection", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        res.setHeader(key, value as string);
      }
    }

    res.setHeader("X-APIBazar-Response-Time", `${duration}ms`);
    res.setHeader("X-APIBazar-Cache", "MISS");
    res.send(response.data);
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    logger.error("API proxy error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        res.status(axiosError.response.status || 500).json({
          error: "API request failed",
          status: axiosError.response.status,
          message: axiosError.message,
          data: axiosError.response.data,
        });
      } else if (axiosError.request) {
        res.status(504).json({
          error: "Gateway Timeout",
          message: "No response received from the target API",
        });
      } else {
        res.status(500).json({
          error: "Request Configuration Error",
          message: axiosError.message,
        });
      }
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred while proxying the request",
      });
    }
  }
};

/**
 * Generate SDK code snippets for API consumption
 */
export const generateSdkCode = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.auth?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { apiId, language } = req.params;
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Find the API and check if user has purchased it
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Check if user owns the API or has purchased it
    let canAccess = api.ownerId === user.id;
    if (!canAccess) {
      const apiPurchase = await prisma.purchasedAPI.findUnique({
        where: { userId_apiId: { userId: user.id, apiId } },
      });
      canAccess = !!apiPurchase;
    }

    if (!canAccess) {
      res.status(403).json({ error: "You don't have access to this API" });
      return;
    }

    // Generate code based on language
    let code = "";
    switch (language.toLowerCase()) {
      case "javascript":
        code = generateJavaScriptCode(api, user.id);
        break;
      case "python":
        code = generatePythonCode(api, user.id);
        break;
      case "curl":
        code = generateCurlExamples(api, user.id);
        break;
      default:
        res.status(400).json({ error: `Language '${language}' is not supported` });
        return;
    }

    res.json({ code });
  } catch (error) {
    logger.error("Error generating SDK code:", error);
    res.status(500).json({ error: "Failed to generate SDK code" });
  }
};

// Helper function to generate JavaScript code
function generateJavaScriptCode(
  api: Api & { endpoints: Endpoint[] },
  userId: string
): string {
  let code = `// ${api.name} JavaScript SDK
const axios = require('axios');
// Your API key (keep this private)
const API_KEY = 'YOUR_API_KEY_HERE';
// Base URL for API calls
const BASE_URL = '${process.env.API_PROXY_URL || ""}/api/${api.id}';
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  timeout: 10000,
});
const ${api.name.replace(/[^a-zA-Z0-9]/g, "")}Client = {`;

  // Generate methods for each endpoint
  api.endpoints.forEach((endpoint: Endpoint) => {
    const functionName = endpoint.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match: string, char: string) =>
        char.toUpperCase()
      );
    const paramsInPath = (endpoint.path.match(/\{([^}]+)\}/g) || []).map(
      (param: string) => param.slice(1, -1)
    );
    const hasBody = ["POST", "PUT", "PATCH"].includes(
      endpoint.method.toUpperCase()
    );

    // Determine parameter list
    let paramList = "";
    if (paramsInPath.length > 0) {
      paramList += paramsInPath.join(", ");
    }
    if (hasBody) {
      paramList += paramList ? ", data" : "data";
    }
    paramList += paramList ? ", options = {}" : "options = {}";

    code += `
  /**
   * ${endpoint.description || endpoint.name}
   */
  ${functionName}: async function(${paramList}) {
    const path = \`${endpoint.path.replace(/\{([^}]+)\}/g, '${$1}')}\`;
    return apiClient.${endpoint.method.toLowerCase()}(path${
      hasBody ? ", data" : ""
    }, options);
  },`;
  });

  code += `
};
module.exports = ${api.name.replace(/[^a-zA-Z0-9]/g, "")}Client;`;
  return code;
}

// Helper function to generate Python code
function generatePythonCode(
  api: Api & { endpoints: Endpoint[] },
  userId: string
): string {
  let code = `# ${api.name} Python SDK
import requests
import json
class ${api.name.replace(/[^a-zA-Z0-9]/g, "")}Client:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = '${process.env.API_PROXY_URL || ""}/api/${api.id}'
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-key': api_key
        }
`;

  // Generate methods for each endpoint
  api.endpoints.forEach((endpoint: Endpoint) => {
    const functionName = endpoint.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match: string, char: string) =>
        char.toLowerCase()
      )
      .replace(/^./, (s) => s.toLowerCase());
    const paramsInPath = (endpoint.path.match(/\{([^}]+)\}/g) || []).map(
      (param: string) => param.slice(1, -1)
    );
    const hasBody = ["POST", "PUT", "PATCH"].includes(
      endpoint.method.toUpperCase()
    );

    // Parameter list
    let paramList = "self";
    if (paramsInPath.length > 0) {
      paramList += ", " + paramsInPath.join(", ");
    }
    if (hasBody) {
      paramList += ", data=None";
    }
    paramList += ", **kwargs";

    code += `
    def ${functionName}(${paramList}):
        """${endpoint.description || endpoint.name}"""
        url = f"{self.base_url}${endpoint.path.replace(/\{([^}]+)\}/g, '{$1}')}"
        headers = {**self.headers, **kwargs.get('headers', {})}
        ${
          hasBody
            ? "response = requests." + endpoint.method.toLowerCase() + "(url, json=data, headers=headers)"
            : "response = requests." + endpoint.method.toLowerCase() + "(url, headers=headers)"
        }
        return response.json()
`;
  });

  code += `
# Example usage:
# client = ${api.name.replace(/[^a-zA-Z0-9]/g, "")}Client('YOUR_API_KEY_HERE')
# result = client.firstEndpointName('param1', 'param2')`;
  return code;
}

// Helper function to generate cURL examples
function generateCurlExamples(
  api: Api & { endpoints: Endpoint[] },
  userId: string
): string {
  let code = `# ${api.name} cURL Examples\n`;

  // Generate cURL for each endpoint
  api.endpoints.forEach((endpoint: Endpoint) => {
    code += `\n## ${endpoint.name}${
      endpoint.description ? ` - ${endpoint.description}` : ""
    }\n`;
    let curlCmd = `curl -X ${endpoint.method.toUpperCase()} "${
      process.env.API_PROXY_URL || ""
    }/api/${api.id}${endpoint.path.replace(/\{([^}]+)\}/g, 'YOUR_$1_HERE')}" \\
  -H "x-api-key: YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json"`;

    // Add request body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(endpoint.method.toUpperCase())) {
      const sampleBody: Record<string, any> = {};
      // Try to generate sample body from schema if available
      if (endpoint.requestBody) {
        try {
          const schema =
            typeof endpoint.requestBody === "string"
              ? JSON.parse(endpoint.requestBody)
              : endpoint.requestBody;
          if (schema && typeof schema === "object" && schema.properties) {
            for (const [key, value] of Object.entries(schema.properties)) {
              const typedValue = value as any; // Type assertion
              if (typedValue.example) {
                sampleBody[key] = typedValue.example;
              } else if (typedValue.type === "string") {
                sampleBody[key] = "string";
              } else if (typedValue.type === "number") {
                sampleBody[key] = 0;
              } else if (typedValue.type === "boolean") {
                sampleBody[key] = false;
              } else if (typedValue.type === "object") {
                sampleBody[key] = {};
              } else if (typedValue.type === "array") {
                sampleBody[key] = [];
              }
            }
          }
        } catch (e) {
          // Use empty object if parsing fails
        }
      }
      curlCmd += ` \\\n  -d '${JSON.stringify(sampleBody, null, 2)}'`;
    }
    code += `\n\`\`\`\n${curlCmd}\n\`\`\`\n`;
  });

  return code;
}

/**
 * Public API testing controller for users who haven't purchased the API
 * This has limitations but allows potential customers to try before buying
 */
export const testPublicEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = performance.now();
  try {
    const { apiId, endpointId } = req.params;

    // Apply stricter rate limits for public testing
    const ip = req.ip || "unknown";
    const rateLimitKey = `public:${ip}:${apiId}`;
    const publicRateLimit = 5; // Only 5 requests per minute for public testing

    // Apply rate limiting for public endpoints
    const limiter = dynamicApiLimiter(rateLimitKey, publicRateLimit);
    try {
      await limiter(req, res, () => {
        /* continue if not rate limited */
      });
    } catch (error) {
      // Rate limit handling is done in the middleware
      return;
    }

    // Find the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Check if API is publicly testable
    if (api.pricingModel === "PAID" && !api.allowPublicTesting) {
      res.status(403).json({
        error: "This API requires purchase before testing",
        message: "The API owner has disabled public testing for this paid API.",
      });
      return;
    }

    // Find specific endpoint if provided
    let endpoint = null;
    if (endpointId) {
      endpoint = api.endpoints.find((e) => e.id === endpointId);
      if (!endpoint) {
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }

      // Check if this specific endpoint allows public testing
      if (endpoint.restrictPublicTesting) {
        res.status(403).json({
          error: "This endpoint requires purchase",
          message: "The API owner has restricted this endpoint to paid users only.",
        });
        return;
      }
    }

    // Validate the test request
    if (!req.body || !req.body.method || !req.body.url) {
      res.status(400).json({ error: "Invalid test request format" });
      return;
    }

    // Prepare request configuration
    const config: AxiosRequestConfig = {
      method: req.body.method,
      url: req.body.url,
      headers: req.body.headers || {},
      params: req.body.queryParams || {},
      data: req.body.body || undefined,
      validateStatus: () => true, // Accept any status
      timeout: 15000, // 15 seconds timeout (shorter than for paid users)
    };

    // Execute the request
    let response: AxiosResponse;
    try {
      response = await axios(config);
    } catch (error) {
      const axiosError = error as AxiosError;
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      return res.status(200).json({
        success: false,
        error: {
          message: axiosError.message,
          code: axiosError.code || "REQUEST_FAILED",
        },
        duration,
        request: {
          method: config.method,
          url: config.url,
          headers: config.headers,
          params: config.params,
          data: config.data,
        },
      });
    }

    const endTime = performance.now();
    let duration = Math.round(endTime - startTime);

    // Track usage for analytics, but with a special flag for free testing
    try {
      await prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          publicTestCount: { increment: 1 },
        } as Prisma.ApiAnalyticsUpdateInput,
      });

      // Track in Redis if available
      if (isRedisAvailable()) {
        const today = new Date().toISOString().split("T")[0];
        await Promise.all([
          // Track public test separately
          cacheData(`analytics:public:${apiId}:${today}`, 1, 60 * 60 * 24 * 7),
        ]);
      }
    } catch (analyticsError) {
      logger.error("Failed to track public API test:", analyticsError);
    }

    // For public testing, apply limitations:
    // 1. Add artificial delay to show performance benefits of purchasing
    if (api.pricingModel === "PAID") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      duration += 500; // Add delay to reported duration
    }

    // 2. Limit response size for large responses
    let responseData = response.data;
    let isTruncated = false;
    const responseStr = JSON.stringify(responseData);

    if (responseStr.length > 5000) {
      isTruncated = true;
      // For JSON responses, truncate in a structured way
      if (typeof responseData === "object" && responseData !== null) {
        if (Array.isArray(responseData)) {
          // For arrays, just take the first few items
          responseData = responseData.slice(0, 3);
        } else {
          // For objects, keep the structure but limit nested objects
          const truncateObject = (
            obj: Record<string, any>,
            depth: number = 0
          ): Record<string, any> => {
            if (depth > 2) return { _truncated: true };
            const result: Record<string, any> = {};
            let i = 0;
            for (const [key, val] of Object.entries(obj)) {
              if (i++ > 10) {
                result._moreProps = `${Object.keys(obj).length - 10} more properties`;
                break;
              }
              if (typeof val === "object" && val !== null) {
                result[key] = truncateObject(val, depth + 1);
              } else {
                result[key] = val;
              }
            }
            return result;
          };
          responseData = truncateObject(responseData);
        }
        // Add message about truncation
        responseData._publicTestLimitation =
          "Response truncated. Purchase API for full response.";
      } else {
        // For non-JSON responses, truncate with a message
        responseData =
          responseStr.substring(0, 5000) + "... [Response truncated for free testing]";
      }
    }

    // 3. Include a message about limitations
    const result = {
      success: response.status >= 200 && response.status < 300,
      duration,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: responseData,
        size: isTruncated ? responseStr.length : JSON.stringify(responseData).length,
      },
      request: {
        method: config.method,
        url: config.url,
        headers: config.headers,
        params: config.params,
        data: config.data,
      },
      publicTesting: {
        limited: true,
        truncated: isTruncated,
        message: "You're testing with free limitations. Purchase for full access.",
        rateLimit: publicRateLimit,
      },
    };

    res.status(200).json(result);
  } catch (error) {
    logger.error("Public API test error:", error);
    res.status(500).json({ error: "Failed to run public API test" });
  }
};

export default {
  proxyApiRequest,
  generateSdkCode,
  testPublicEndpoint,
};