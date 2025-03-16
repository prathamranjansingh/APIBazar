import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { PrismaClient, Prisma, Api, Endpoint, PricingModel } from "@prisma/client";
import { logger } from "../../utils/logger";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { performance } from "perf_hooks";
import crypto from "crypto";
import {
  isRedisAvailable,
  cacheData,
  getCachedData,
  incrementApiUsage,
  CACHE_TTL
} from "../../config/redis";

// Initialize Prisma client
const prisma = new PrismaClient();

// Define interface for cached response
interface CachedResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

// Define types for SDK generation and testing
interface TestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    keyName?: string;
    in?: 'header' | 'query';
  };
  timeout?: number;
}

interface TestResponse {
  success: boolean;
  duration: number;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    data: any;
    size: number;
  };
  error?: {
    message: string;
    code: string;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    data: any;
  };
  cache?: 'HIT' | 'MISS';
  publicTesting?: {
    limited: boolean;
    truncated: boolean;
    message: string;
    rateLimit: number;
  };
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
 * Generate JavaScript SDK code for an API
 */
const generateJavaScriptCode = (api: Api & { endpoints: Endpoint[] }): string => {
  const apiName = api.name.replace(/\s+/g, '');
  let code = `// ${api.name} JavaScript SDK
// Generated on ${new Date().toISOString().split('T')[0]}

class ${apiName}Client {
  constructor(apiKey = null) {
    this.baseUrl = "${api.baseUrl || 'https://api.example.com'}";
    this.apiKey = apiKey;
  }

  async request(method, path, params = {}, data = null, headers = {}) {
    let url = this.baseUrl + path;
    // Add API key if available
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    // Add query parameters
    if (Object.keys(params).length) {
      const queryString = new URLSearchParams(params).toString();
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    // Add request body for appropriate methods
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && data) {
      options.body = JSON.stringify(data);
    }
    // Execute request
    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        };
      }
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
`;

  // Generate methods for each endpoint
  api.endpoints.forEach(endpoint => {
    const methodName = endpoint.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/gi, '');
    const pathParams = (endpoint.path.match(/\{([^}]+)\}/g) || [])
      .map(param => param.slice(1, -1));
    let methodParams = '';
    let methodPath = endpoint.path;
    if (pathParams.length) {
      methodParams = pathParams.join(', ') + ', ';
      pathParams.forEach(param => {
        methodPath = methodPath.replace(`{${param}}`, `\${${param}}`);
      });
    }
    code += `
  // ${endpoint.description || endpoint.name}
  async ${methodName}(${methodParams}params = {}, data = null, headers = {}) {
    return this.request(
      "${endpoint.method}",
      \`${methodPath}\`,
      params,
      data,
      headers
    );
  }
`;
  });
  code += `}
// Example usage:
// const client = new ${apiName}Client("YOUR_API_KEY");
// client.${api.endpoints[0]?.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '') || 'callEndpoint'}()
//   .then(data => console.log(data))
//   .catch(error => console.error(error));
export default ${apiName}Client;
`;
  return code;
};

/**
 * Generate Python SDK code for an API
 */
const generatePythonCode = (api: Api & { endpoints: Endpoint[] }): string => {
  const apiName = api.name.replace(/\s+/g, '');
  let code = `# ${api.name} Python SDK
# Generated on ${new Date().toISOString().split('T')[0]}
import requests
import json

class ${apiName}Client:
    def __init__(self, api_key=None):
        self.base_url = "${api.baseUrl || 'https://api.example.com'}"
        self.api_key = api_key

    def request(self, method, path, params=None, data=None, headers=None):
        url = self.base_url + path
        if headers is None:
            headers = {}
        # Add API key if available
        if self.api_key:
            headers['x-api-key'] = self.api_key
        # Add content type for JSON
        headers['Content-Type'] = 'application/json'
        # Prepare request arguments
        kwargs = {
            'method': method,
            'url': url,
            'headers': headers,
            'params': params,
        }
        # Add request body for appropriate methods
        if method.upper() in ['POST', 'PUT', 'PATCH'] and data is not None:
            kwargs['json'] = data
        # Execute request
        try:
            response = requests.request(**kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            if e.response is not None:
                print(f"Response status: {e.response.status_code}")
                try:
                    error_data = e.response.json()
                    print(f"Error data: {error_data}")
                except:
                    print(f"Error text: {e.response.text}")
            raise
`;

  // Generate methods for each endpoint
  api.endpoints.forEach(endpoint => {
    const methodName = endpoint.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/gi, '');
    const pathParams = (endpoint.path.match(/\{([^}]+)\}/g) || [])
      .map(param => param.slice(1, -1));
    let methodParams = '';
    let methodPath = endpoint.path;
    if (pathParams.length) {
      methodParams = ', ' + pathParams.join(', ');
      pathParams.forEach(param => {
        methodPath = methodPath.replace(`{${param}}`, `{${param}}`);
      });
    }
    code += `
    # ${endpoint.description || endpoint.name}
    def ${methodName}(self${methodParams}, params=None, data=None, headers=None):
        path = f"${methodPath}"
        return self.request(
            "${endpoint.method}",
            path,
            params,
            data,
            headers
        )
`;
  });
  code += `
# Example usage:
# client = ${apiName}Client("YOUR_API_KEY")
# result = client.${api.endpoints[0]?.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '') || 'call_endpoint'}()
# print(result)
`;
  return code;
};

/**
 * Generate cURL examples for an API
 */
const generateCurlExamples = (api: Api & { endpoints: Endpoint[] }): string => {
  let code = `# ${api.name} - cURL Examples\n\n`;
  api.endpoints.forEach(endpoint => {
    code += `*${endpoint.name}\n${endpoint.description || ''}\n\n\`\`\`bash\n`;
    // Replace path parameters with example values
    let examplePath = endpoint.path;
    const pathParams = (endpoint.path.match(/\{([^}]+)\}/g) || []);
    pathParams.forEach(param => {
      const paramName = param.slice(1, -1);
      examplePath = examplePath.replace(param, `example_${paramName}`);
    });
    const url = `${api.baseUrl || 'https://api.example.com'}${examplePath}`;
    code += `curl -X ${endpoint.method} "${url}" \\\n`;
    code += `  -H "Content-Type: application/json" \\\n`;
    code += `  -H "x-api-key: YOUR_API_KEY"`;
    // Add example request body for appropriate methods
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      let exampleBody = {};
      if (endpoint.requestBody) {
        try {
          exampleBody = typeof endpoint.requestBody === 'string'
            ? JSON.parse(endpoint.requestBody)
            : endpoint.requestBody;
        } catch (e) {
          // If parsing fails, use empty object
        }
      }
      code += ` \\\n  -d '${JSON.stringify(exampleBody, null, 2)}'`;
    }
    code += `\n\`\`\`\n\n`;
  });
  return code;
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
    // Get user from auth
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
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
    // Check rate limits for this user
    // If endpoint has custom rate limit, use that, otherwise use API default
    const rateLimit = endpoint.rateLimit || api.rateLimit;
    // Get API key for this user
    const apiKey = await prisma.apiKey.findFirst({
      where: { userId: user.id, apiId },
    });
    // Check if user has exceeded rate limit
    if (apiKey) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const requestCount = await prisma.rateLimitLog.count({
        where: {
          apiKeyId: apiKey.id,
          timestamp: { gte: oneMinuteAgo }
        }
      });
      if (requestCount >= rateLimit) {
        res.status(429).json({
          error: "Too Many Requests",
          message: `Rate limit of ${rateLimit} requests per minute exceeded`
        });
        return;
      }
      // Create rate limit log entry
      await prisma.rateLimitLog.create({
        data: {
          apiKeyId: apiKey.id,
          endpoint: endpoint.path,
          ip: req.ip || 'unknown'
        }
      });
    }
    // Parse path parameters
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
    // Construct target URL
    let targetUrl = api.baseUrl || "";
    let processedPath = endpoint.path;
    for (const [key, value] of Object.entries(pathParams)) {
      processedPath = processedPath.replace(`{${key}}`, encodeURIComponent(value));
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
          "X-API-Cache": "HIT",
          "X-API-Response-Time": `${duration}ms`,
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
        // Update API analytics asynchronously
        try {
          await prisma.apiAnalytics.update({
            where: { apiId },
            data: {
              totalCalls: { increment: 1 },
              successCalls: { increment: 1 }
            },
          });
        } catch (err) {
          logger.warn("Failed to update API analytics:", err);
        }
        res.send(cachedResponse.data);
        return;
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
    // Remove headers that should not be forwarded
    if (config.headers) {
      ["host", "connection", "authorization", "content-length"].forEach((header) => {
        if (config.headers) {
          delete config.headers[header];
        }
      });
    }
    // Add API key to request if available
    if (apiKey && config.headers) {
      config.headers["x-api-key"] = apiKey.id;
    }
    // Execute the request
    const response = await axios(config);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    // Cache the response if it's cacheable
    if (shouldCacheResponse(req.method, response.status) && isRedisAvailable()) {
      const ttl = CACHE_TTL.MEDIUM;
      const cacheableResponse: CachedResponse = {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
      };
      cacheData(cacheKey, cacheableResponse, ttl).catch((err) => {
        logger.error(`Failed to cache API response: ${err}`);
      });
    }
    // Update API analytics asynchronously
    try {
      const success = response.status >= 200 && response.status < 300;
      await prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          totalCalls: { increment: 1 },
          successCalls: { increment: success ? 1 : 0 },
          failedCalls: { increment: success ? 0 : 1 },
          responseTimeAvg: { set: ((await prisma.apiAnalytics.findUnique({ where: { apiId } }))?.responseTimeAvg || 0 + duration) / 2 }
        },
      });
    } catch (err) {
      logger.warn("Failed to update API analytics:", err);
    }
    // Forward the response
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
    res.setHeader("X-API-Response-Time", `${duration}ms`);
    res.setHeader("X-API-Cache", "MISS");
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
 * Generate SDK code in the requested language
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
    // Get user from auth
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
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
    // Generate code based on language
    let code = "";
    let fileName = "";
    switch (language.toLowerCase()) {
      case "javascript":
        code = generateJavaScriptCode(api);
        fileName = `${api.name.replace(/\s+/g, '')}.js`;
        break;
      case "python":
        code = generatePythonCode(api);
        fileName = `${api.name.replace(/\s+/g, '')}.py`;
        break;
      case "curl":
        code = generateCurlExamples(api);
        fileName = `${api.name.replace(/\s+/g, '')}_curl_examples.md`;
        break;
      default:
        res.status(400).json({ error: `Language '${language}' is not supported` });
        return;
    }
    res.json({
      code,
      language: language.toLowerCase(),
      fileName
    });
  } catch (error) {
    logger.error("Error generating SDK code:", error);
    res.status(500).json({ error: "Failed to generate SDK code" });
  }
};

/**
 * Test public endpoint without authentication
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
    const publicRateLimit = 5; // Only 5 requests per minute for public testing
    // Check rate limits for public testing (simple in-memory mechanism)
    const rateLimitKey = `public-test:${ip}:${apiId}`;
    if (isRedisAvailable()) {
      // Use Redis for rate limiting
      const requestCount = await getCachedData<number>(rateLimitKey) || 0;
      if (requestCount >= publicRateLimit) {
        res.status(429).json({
          error: "Too Many Requests",
          message: `Rate limit of ${publicRateLimit} public tests per minute exceeded`
        });
        return;
      }
      await cacheData(rateLimitKey, requestCount + 1, 60); // 60 second expiry
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
    // Check if the API allows public testing
    if (api.pricingModel === PricingModel.PAID) {
      res.status(403).json({
        error: "This API requires purchase before testing",
        message: "The API owner has disabled public testing for this paid API."
      });
      return;
    }
    // Find the specific endpoint if provided
    let endpoint = null;
    if (endpointId) {
      endpoint = api.endpoints.find(e => e.id === endpointId) || null;
      if (!endpoint) {
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }
    }
    // Validate the test request
    if (!req.body || !req.body.method || !req.body.url) {
      res.status(400).json({ error: "Invalid test request format" });
      return;
    }
    const testRequest = req.body as TestRequest;
    // Prepare request configuration
    const config: AxiosRequestConfig = {
      method: testRequest.method,
      url: testRequest.url,
      headers: testRequest.headers || {},
      params: testRequest.queryParams || {},
      data: testRequest.body || undefined,
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
      res.status(200).json({
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
      return;
    }
    const endTime = performance.now();
    let duration = Math.round(endTime - startTime);
    // Track usage for analytics
    try {
      await prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          totalCalls: { increment: 1 },
          successCalls: { increment: response.status >= 200 && response.status < 300 ? 1 : 0 },
          failedCalls: { increment: response.status >= 200 && response.status < 300 ? 0 : 1 }
        },
      });
    } catch (analyticsError) {
      logger.error("Failed to track public API test:", analyticsError);
    }
    // For public testing, apply limitations:
    // 1. Add artificial delay to show performance benefits of purchasing
    if (String(api.pricingModel) === PricingModel.PAID) {
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
    // Format the response
    const result: TestResponse = {
      success: response.status >= 200 && response.status < 300,
      duration,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string | string[]>,
        data: responseData,
        size: typeof responseData === 'object' ? JSON.stringify(responseData).length : String(responseData).length
      },
      request: {
        method: config.method || '',
        url: config.url || '',
        headers: config.headers as Record<string, string> || {},
        params: config.params as Record<string, string> || {},
        data: config.data
      },
      publicTesting: {
        limited: true,
        truncated: isTruncated,
        message: "You're testing with free limitations. Purchase for full access.",
        rateLimit: publicRateLimit
      }
    };
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error in public API test:", error);
    res.status(500).json({ error: "Failed to execute public API test" });
  }
};

// Export controller functions
export default {
  proxyApiRequest,
  generateSdkCode,
  testPublicEndpoint,
};