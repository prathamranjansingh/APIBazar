import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import { PrismaClient, Prisma, Api, Endpoint } from "@prisma/client";
import { logger } from "../../utils/logger";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { z } from "zod";
import { performance } from "perf_hooks";
import {
  isRedisAvailable,
  cacheData,
  getCachedData,
  CACHE_TTL
} from "../../config/redis";
import crypto from 'crypto';
import { triggerWebhooks } from '../../services/webhookService';
import geoip from 'geoip-lite';

const prisma = new PrismaClient();

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

interface SampleRequest {
  sampleRequest: TestRequest;
  endpoint: {
    id: string;
    name: string;
    method: string;
    path: string;
    description: string;
  };
}

// Validation schema for test requests
const testRequestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]),
  url: z.string().url("Must be a valid URL"),
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.string()).optional(),
  body: z.any().optional(),
  auth: z.object({
    type: z.enum(["none", "basic", "bearer", "apiKey"]),
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    key: z.string().optional(),
    keyName: z.string().optional(),
    in: z.enum(["header", "query"]).optional()
  }).optional(),
  timeout: z.number().min(1).max(60000).optional(),
});

/**
 * Execute a test against an endpoint for authenticated users who have purchased the API
 */

export const testEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    await prisma.apiCallLog.create({
      data: {
        apiId: req.params.apiId,
        statusCode: 401,
        responseTime: 0,
        endpoint: req.originalUrl,
        consumerId: null,
        country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip,
        errorMessage: "Unauthorized",
      },
    });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { apiId, endpointId } = req.params;

    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      await prisma.apiCallLog.create({
        data: {
          apiId,
          statusCode: 404,
          responseTime: 0,
          endpoint: req.originalUrl,
          consumerId: null,
          country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
          errorMessage: "User not found",
        },
      });
      res.status(404).json({ error: "User not found" });
      return;
    }

    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      await prisma.apiCallLog.create({
        data: {
          apiId,
          statusCode: 404,
          responseTime: 0,
          endpoint: req.originalUrl,
          consumerId: user.id,
          country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
          errorMessage: "API not found",
        },
      });
      res.status(404).json({ error: "API not found" });
      return;
    }

    let canTest = api.ownerId === user.id;
    if (!canTest) {
      const purchased = await prisma.purchasedAPI.findUnique({
        where: { userId_apiId: { userId: user.id, apiId } },
      });
      canTest = !!purchased;
    }

    if (!canTest) {
      return testPublicEndpoint(req as Request, res);
    }

    let endpoint: Endpoint | null = null;
    if (endpointId) {
      endpoint = api.endpoints.find((e) => e.id === endpointId) || null;
      if (!endpoint) {
        await prisma.apiCallLog.create({
          data: {
            apiId,
            statusCode: 404,
            responseTime: 0,
            endpoint: req.originalUrl,
            consumerId: user.id,
            country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
            userAgent: req.headers['user-agent'] || null,
            ipAddress: req.ip,
            errorMessage: "Endpoint not found",
          },
        });
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }
    }

    const validated = testRequestSchema.safeParse(req.body);
    if (!validated.success) {
      await prisma.apiCallLog.create({
        data: {
          apiId,
          statusCode: 400,
          responseTime: 0,
          endpoint: req.originalUrl,
          consumerId: user.id,
          country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
          errorMessage: "Invalid request format",
        },
      });
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const testRequest = validated.data as TestRequest;

    const config: AxiosRequestConfig = {
      method: testRequest.method,
      url: testRequest.url,
      headers: testRequest.headers || {},
      params: testRequest.queryParams || {},
      data: testRequest.body,
      validateStatus: () => true,
      timeout: testRequest.timeout || 30000,
    };

    if (testRequest.auth) {
      switch (testRequest.auth.type) {
        case "basic":
          if (testRequest.auth.username && testRequest.auth.password) {
            config.auth = {
              username: testRequest.auth.username,
              password: testRequest.auth.password,
            };
          }
          break;
        case "bearer":
          if (testRequest.auth.token && config.headers) {
            config.headers.Authorization = `Bearer ${testRequest.auth.token}`;
          }
          break;
        case "apiKey":
          if (testRequest.auth.key && testRequest.auth.keyName) {
            if (testRequest.auth.in === "header" && config.headers) {
              config.headers[testRequest.auth.keyName] = testRequest.auth.key;
            } else if (testRequest.auth.in === "query" && config.params) {
              (config.params as Record<string, string>)[testRequest.auth.keyName] = testRequest.auth.key;
            }
          }
          break;
      }
    }

    const startTime = performance.now();
    let response: AxiosResponse;
    let error: { message: string; code: string } | null = null;

    try {
      response = await axios(config);
    } catch (e) {
      const axiosError = e as AxiosError;
      error = {
        message: axiosError.message,
        code: axiosError.code || "REQUEST_FAILED",
      };
      response = {
        status: 0,
        statusText: "Error",
        headers: {},
        data: null,
        config,
        request: {},
      } as AxiosResponse;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    try {
      await prisma.apiCallLog.create({
        data: {
          apiId,
          statusCode: response.status,
          responseTime: duration,
          endpoint: endpoint?.path || req.originalUrl,
          consumerId: user?.id || null,
          country: req.ip ? geoip.lookup(req.ip)?.country || null : null,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip,
          errorMessage: error?.message || null,
        },
      });
    } catch (logError) {
      logger.warn("Failed to log API call:", logError);
    }

    // Ensure updateApiAnalytics is always called if apiId is present
    if (apiId) {
      try {
        await updateApiAnalytics(apiId, duration, true);
      } catch (analyticsError) {
        logger.warn("Failed to update API analytics:", analyticsError);
      }
    }

    let result: TestResponse;
    if (error) {
      result = {
        success: false,
        error,
        duration,
        request: {
          method: config.method || "",
          url: config.url || "",
          headers: (config.headers as Record<string, string>) || {},
          params: (config.params as Record<string, string>) || {},
          data: config.data,
        },
        cache: "MISS",
      };
    } else {
      const headers: Record<string, string | string[]> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        headers[key] = typeof value === "string" || Array.isArray(value) ? value : String(value);
      }

      result = {
        success: response.status >= 200 && response.status < 300,
        duration,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers,
          data: response.data,
          size: JSON.stringify(response.data || "").length,
        },
        request: {
          method: config.method || "",
          url: config.url || "",
          headers: (config.headers as Record<string, string>) || {},
          params: (config.params as Record<string, string>) || {},
          data: config.data,
        },
        cache: "MISS",
      };
    }

    res.json(result);
  } catch (error) {
    logger.error("Error testing endpoint:", error);
    res.status(500).json({ error: "Failed to execute API test" });
  }
};




/**
 * Test API for unauthenticated users or users who haven't purchased the API
 */
export const testPublicEndpoint = async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();
  
  try {
    const { apiId, endpointId } = req.params;
    const ip = req.ip || "unknown";
    const publicRateLimit = 5;

    const validated = testRequestSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const testRequest = validated.data as TestRequest;

    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.pricingModel === "PAID" && !(api as any).allowPublicTesting) {
      res.status(403).json({
        error: "This API requires purchase before testing",
        message: "The API owner has disabled public testing for this paid API.",
      });
      return;
    }

    let endpoint = null;
    if (endpointId) {
      endpoint = api.endpoints.find((e) => e.id === endpointId) || null;
      if (!endpoint) {
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }

      if ((endpoint as any).restrictPublicTesting) {
        res.status(403).json({
          error: "This endpoint requires purchase",
          message: "The API owner has restricted this endpoint to paid users only.",
        });
        return;
      }
    }

    const config: AxiosRequestConfig = {
      method: testRequest.method,
      url: testRequest.url,
      headers: testRequest.headers || {},
      params: testRequest.queryParams || {},
      data: testRequest.body,
      validateStatus: () => true,
      timeout: 15000,
    };

    if (testRequest.auth) {
      switch (testRequest.auth.type) {
        case "basic":
          if (testRequest.auth.username && testRequest.auth.password) {
            config.auth = {
              username: testRequest.auth.username,
              password: testRequest.auth.password,
            };
          }
          break;
        case "bearer":
          if (testRequest.auth.token && config.headers) {
            config.headers.Authorization = `Bearer ${testRequest.auth.token}`;
          }
          break;
        case "apiKey":
          if (testRequest.auth.key && testRequest.auth.keyName) {
            if (testRequest.auth.in === "header" && config.headers) {
              config.headers[testRequest.auth.keyName] = testRequest.auth.key;
            } else if (testRequest.auth.in === "query" && config.params) {
              (config.params as Record<string, string>)[testRequest.auth.keyName] =
                testRequest.auth.key;
            }
          }
          break;
      }
    }

    let response: AxiosResponse;
    let error: { message: string; code: string } | null = null;
    let isSuccessful = false;

    try {
      response = await axios(config);
      isSuccessful = response.status >= 200 && response.status < 300;
    } catch (e) {
      const axiosError = e as AxiosError;
      error = {
        message: axiosError.message,
        code: axiosError.code || "REQUEST_FAILED",
      };

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      await updateApiAnalytics(apiId, duration, false);

      await prisma.apiCallLog.create({
        data: {
          apiId,
          statusCode: 0,
          responseTime: duration,
          endpoint: endpoint?.path || req.originalUrl,
          consumerId: null,
          country: (() => {
            try {
              const geo = ip ? geoip.lookup(ip) : null;
              return geo ? geo.country : null;
            } catch (error) {
              console.error("Error getting geolocation:", error);
              return null;
            }
          })(),
          userAgent: req.headers["user-agent"] || null,
          ipAddress: ip,
          errorMessage: error?.message || "Request failed",
        },
      });

      res.status(200).json({
        success: false,
        error,
        duration,
        request: {
          method: config.method || "",
          url: config.url || "",
          headers: (config.headers as Record<string, string>) || {},
          params: (config.params as Record<string, string>) || {},
          data: config.data,
        },
        publicTesting: {
          limited: true,
          truncated: false,
          message: "You're testing with free limitations. Purchase for full access.",
          rateLimit: publicRateLimit,
        },
      });
      return;
    }

    const endTime = performance.now();
    let duration = Math.round(endTime - startTime);

    await updateApiAnalytics(apiId, duration, true);

    await prisma.apiCallLog.create({
      data: {
        apiId,
        statusCode: response.status,
        responseTime: duration,
        endpoint: endpoint?.path || req.originalUrl,
        consumerId: null,
        country: (() => {
          try {
            const geo = ip ? geoip.lookup(ip) : null;
            return geo ? geo.country : null;
          } catch (error) {
            console.error("Error getting geolocation:", error);
            return null;
          }
        })(),
        userAgent: req.headers["user-agent"] || null,
        ipAddress: ip,
        errorMessage: null,
      },
    });

    if (api.pricingModel === "PAID") {
      await new Promise((resolve) => setTimeout(resolve, 500));
      duration += 500;
    }

    let responseData = response.data;
    let isTruncated = false;

    if (responseData) {
      const responseStr = JSON.stringify(responseData);
      if (responseStr.length > 5000) {
        isTruncated = true;
        if (typeof responseData === "object" && responseData !== null) {
          if (Array.isArray(responseData)) {
            responseData = responseData.slice(0, 3);
          } else {
            const truncateObject = (obj: Record<string, any>, depth: number = 0): Record<string, any> => {
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

          if (typeof responseData === "object" && responseData !== null) {
            responseData._publicTestLimitation = "Response truncated. Purchase API for full response.";
          }
        } else {
          responseData = responseStr.substring(0, 5000) + "... [Response truncated for free testing]";
        }
      }
    }

    res.status(200).json({
      success: isSuccessful,
      duration,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string | string[]>,
        data: responseData,
        size: typeof responseData === "object"
          ? JSON.stringify(responseData).length
          : String(responseData).length,
      },
      request: {
        method: config.method || "",
        url: config.url || "",
        headers: (config.headers as Record<string, string>) || {},
        params: (config.params as Record<string, string>) || {},
        data: config.data,
      },
      publicTesting: {
        limited: true,
        truncated: isTruncated,
        message: "You're testing with free limitations. Purchase for full access.",
        rateLimit: publicRateLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute public API test" });
  }
};

/**
 * Helper function to update API analytics
 */
async function updateApiAnalytics(
  apiId: string,
  duration: number,
  isSuccessful: boolean
): Promise<void> {
  try {
    // Check if analytics record exists
    let analytics = await prisma.apiAnalytics.findUnique({
      where: { apiId },
    });

    if (!analytics) {
      // Create a new analytics record
      await prisma.apiAnalytics.create({
        data: {
          apiId,
          totalCalls: 1,
          successCalls: isSuccessful ? 1 : 0,
          failedCalls: isSuccessful ? 0 : 1,
          responseTimeAvg: duration,
          errorRate: isSuccessful ? 0 : 1,
        },
      });
    } else {
      // Update existing analytics
      const newTotalCalls = analytics.totalCalls + 1;
      const newSuccessCalls = analytics.successCalls + (isSuccessful ? 1 : 0);
      const newFailedCalls = analytics.failedCalls + (isSuccessful ? 0 : 1);

      // Calculate new average response time
      const newResponseTimeAvg =
        (analytics.responseTimeAvg * analytics.totalCalls + duration) / newTotalCalls;

      // Calculate new error rate
      const newErrorRate = newFailedCalls / newTotalCalls;

      await prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          totalCalls: newTotalCalls,
          successCalls: newSuccessCalls,
          failedCalls: newFailedCalls,
          responseTimeAvg: newResponseTimeAvg,
          errorRate: newErrorRate,
        },
      });
    }
  } catch (error) {
    // Re-throw to let caller handle or log the error
    throw error;
  }
}

/**
 * Generate a cURL command for an endpoint test
 */
export const generateCurl = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = testRequestSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const testRequest = validated.data as TestRequest;
    let curlCommand = `curl -X ${testRequest.method} `;

    // Add headers
    if (testRequest.headers && Object.keys(testRequest.headers).length > 0) {
      for (const [key, value] of Object.entries(testRequest.headers)) {
        curlCommand += `-H "${key}: ${value}" `;
      }
    }

    // Add authentication
    if (testRequest.auth) {
      switch (testRequest.auth.type) {
        case "basic":
          if (testRequest.auth.username && testRequest.auth.password) {
            curlCommand += `-u "${testRequest.auth.username}:${testRequest.auth.password}" `;
          }
          break;
        case "bearer":
          if (testRequest.auth.token) {
            curlCommand += `-H "Authorization: Bearer ${testRequest.auth.token}" `;
          }
          break;
        case "apiKey":
          if (testRequest.auth.key && testRequest.auth.keyName) {
            if (testRequest.auth.in === "header") {
              curlCommand += `-H "${testRequest.auth.keyName}: ${testRequest.auth.key}" `;
            }
          }
          break;
      }
    }

    // Add request body if present
    if (testRequest.body) {
      let bodyString: string;
      if (typeof testRequest.body === 'object') {
        bodyString = JSON.stringify(testRequest.body);
        // Add content-type if not present
        if (!testRequest.headers || !Object.entries(testRequest.headers).some(([key]) => key.toLowerCase() === 'content-type')) {
          curlCommand += `-H "Content-Type: application/json" `;
        }
      } else {
        bodyString = String(testRequest.body);
      }
      curlCommand += `-d '${bodyString}' `;
    }

    // Build URL with query parameters
    let url = testRequest.url;
    if (testRequest.queryParams && Object.keys(testRequest.queryParams).length > 0) {
      try {
        const urlObj = new URL(testRequest.url);
        for (const [key, value] of Object.entries(testRequest.queryParams)) {
          urlObj.searchParams.append(key, value);
        }
        url = urlObj.toString();
        // Add API key in query if specified
        if (testRequest.auth?.type === "apiKey" &&
            testRequest.auth.in === "query" &&
            testRequest.auth.key &&
            testRequest.auth.keyName) {
          if (!url.includes('?')) {
            url += '?';
          } else if (!url.endsWith('&')) {
            url += '&';
          }
          url += `${testRequest.auth.keyName}=${testRequest.auth.key}`;
        }
      } catch (e) {
        logger.warn("Error parsing URL for cURL command:", e);
      }
    }

    curlCommand += `"${url}"`;
    res.json({ curl: curlCommand });
  } catch (error) {
    logger.error("Error generating cURL command:", error);
    res.status(500).json({ error: "Failed to generate cURL command" });
  }
};

/**
 * Load sample request for an endpoint
 */
export const getSampleRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { apiId, endpointId } = req.params;
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Find the API and endpoint
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        id: endpointId,
        apiId
      },
      include: {
        api: {
          select: {
            id: true,
            baseUrl: true,
            ownerId: true
          }
        }
      }
    });

    if (!endpoint) {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }

    // Check if user can access
    let canAccess = endpoint.api.ownerId === user.id;
    if (!canAccess) {
      const purchased = await prisma.purchasedAPI.findUnique({
        where: {
          userId_apiId: {
            userId: user.id,
            apiId
          }
        }
      });
      canAccess = !!purchased;
    }

    // For sample requests, we allow everyone to access, even without purchase
    // This helps users evaluate the API before buying
    // Generate a sample request based on endpoint data
    const sampleUrl = endpoint.api.baseUrl ?
      `${endpoint.api.baseUrl}${endpoint.path}` :
      `https://example.com${endpoint.path}`;

    const sampleRequest: TestRequest = {
      method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
      url: sampleUrl,
      headers: {},
      queryParams: {},
      body: endpoint.requestBody as any || undefined,
      auth: {
        type: 'none'
      }
    };

    // Try to parse any defined headers from endpoint schema
    if (endpoint.headers) {
      try {
        const headerSchema = typeof endpoint.headers === 'string' ? JSON.parse(endpoint.headers) : endpoint.headers;
        if (headerSchema && typeof headerSchema === 'object') {
          // Extract sample headers
          for (const [key, value] of Object.entries(headerSchema)) {
            const typedValue = value as any;
            if (typeof typedValue === 'object' && typedValue !== null) {
              // Use example value if available
              if ('example' in typedValue) {
                sampleRequest.headers = sampleRequest.headers || {};
                sampleRequest.headers[key] = typedValue.example;
              }
            }
          }
        }
      } catch (e) {
        logger.warn(`Failed to parse header schema for endpoint ${endpointId}: ${e}`);
      }
    }

    // Define result
    const result: SampleRequest = {
      sampleRequest,
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description || ''
      }
    };

    res.json(result);
  } catch (error) {
    logger.error("Error generating sample request:", error);
    res.status(500).json({ error: "Failed to generate sample request" });
  }
};

export default {
  testEndpoint,
  testPublicEndpoint,
  generateCurl,
  getSampleRequest
};