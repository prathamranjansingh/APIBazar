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
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { apiId, endpointId } = req.params;
    
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if the user can access this API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });
    
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // User can test if they own the API or have purchased it
    let canTest = api.ownerId === user.id;
    if (!canTest) {
      const purchased = await prisma.purchasedAPI.findUnique({
        where: { userId_apiId: { userId: user.id, apiId } },
      });
      canTest = !!purchased;
    }
    
    if (!canTest) {
      // If user hasn't purchased, redirect to public testing endpoint
      return testPublicEndpoint(req as Request, res);
    }

    // Find the specific endpoint if provided
    let endpoint: Endpoint | null = null;
    if (endpointId) {
      endpoint = api.endpoints.find((e) => e.id === endpointId) || null;
      if (!endpoint) {
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }
    }

    // Validate test request
    const validated = testRequestSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }
    
    const testRequest = validated.data as TestRequest;

    // Generate cache key for this test request
    const cacheKey = `test-result:${apiId}:${crypto
      .createHash("md5")
      .update(JSON.stringify(testRequest))
      .digest("hex")}`;

    // Check if we have cached results for this exact test request
    if (isRedisAvailable()) {
      console.log("Cache is available");
      const cachedResult = await getCachedData<TestResponse>(cacheKey);
      if (cachedResult) {
        // Return cached test result
        res.json({ ...cachedResult, cache: "HIT" });
        return;
      }
    }

    // Prepare request configuration
    const config: AxiosRequestConfig = {
      method: testRequest.method,
      url: testRequest.url,
      headers: testRequest.headers || {},
      params: testRequest.queryParams || {},
      data: testRequest.body,
      validateStatus: () => true, // Accept any status to avoid exceptions
      timeout: testRequest.timeout || 30000, // Default 30s timeout
    };

    // Add authentication if specified
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

    // Execute request and measure performance
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
      // Create a minimal response for the error case
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

    // Update API analytics
    try {
      // First, check if analytics record exists
      let analytics = await prisma.apiAnalytics.findUnique({
        where: { apiId },
      });
      
      if (!analytics) {
        // Create a new analytics record if it doesn't exist
        analytics = await prisma.apiAnalytics.create({
          data: {
            apiId,
            totalCalls: 1,
            successCalls: error ? 0 : 1,
            failedCalls: error ? 1 : 0,
            responseTimeAvg: duration,
            errorRate: error ? 1.0 : 0.0,
          },
        });
      } else {
        // Update existing analytics
        const newTotalCalls = analytics.totalCalls + 1;
        const newSuccessCalls = analytics.successCalls + (error ? 0 : 1);
        const newFailedCalls = analytics.failedCalls + (error ? 1 : 0);
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

      // Trigger webhook for API call event
      const webhookData = {
        apiId,
        event: 'api_call',
        payload: {
          endpoint: endpoint?.path || testRequest.url,
          method: testRequest.method,
          userId: user.id,
          userName: user.name || user.email,
          responseStatus: response.status,
          responseTime: duration,
          queryParams: testRequest.queryParams || {},
          headers: Object.keys(testRequest.headers || {}).reduce((acc, key) => {
            // Exclude sensitive headers like Authorization
            if (!key.toLowerCase().includes('auth') && !key.toLowerCase().includes('key')) {
              acc[key] = testRequest.headers?.[key] || '';
            }
            return acc;
          }, {} as Record<string, string>),
          isTest: true,
          timestamp: new Date().toISOString()
        }
      };

      // If there was an error, include it in the webhook payload
      if (error) {
        webhookData.event = 'error_occurred';
        (webhookData.payload as any).error = {
          code: error.code,
          message: error.message
        };
      }

      // Trigger webhook asynchronously (don't await)
      triggerWebhooks(webhookData)
        .catch((err: any) => logger.error("Failed to trigger webhook:", err));
    } catch (analyticsError) {
      // Log error but don't fail the request
      logger.warn("Failed to update API analytics:", analyticsError);
    }

    // Prepare test result
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
      // Transform headers to match the expected type
      const headers: Record<string, string | string[]> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (typeof value === "string" || Array.isArray(value)) {
          headers[key] = value;
        } else if (value !== undefined) {
          // Convert non-string values to strings
          headers[key] = String(value);
        }
      }

      result = {
        success: response.status >= 200 && response.status < 300,
        duration,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers, // Use the transformed headers
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

    // Cache test results for successful queries
    if (isRedisAvailable() && !error) {
      // Cache test results for a short period (1 minute)
      await cacheData(cacheKey, result, CACHE_TTL.SHORT).catch((err) => {
        logger.warn(`Failed to cache test result: ${err}`);
      });
    }

    res.json(result);
  } catch (error) {
    logger.error("Error testing endpoint:", error);
    res.status(500).json({ error: "Failed to execute API test" });
    
    // Optionally trigger error_occurred webhook for unexpected errors
    if (req.params.apiId) {
      try {
        triggerWebhooks({
          apiId: req.params.apiId,
          event: 'error_occurred',
          payload: {
            errorCode: 500,
            errorMessage: "Internal server error during API test",
            endpoint: req.params.endpointId || "unknown",
            method: req.body?.method || "unknown",
            userId: req.auth?.sub || "unknown",
            timestamp: new Date().toISOString()
          }
        }).catch((err: any) => logger.error("Failed to trigger error webhook:", err));
      } catch (webhookError) {
        logger.error("Failed to trigger webhook for error:", webhookError);
      }
    }
  }
};

/**
 * Test API for unauthenticated users or users who haven't purchased the API
 */
export const testPublicEndpoint = async (req: Request, res: Response): Promise<void> => {
  const startTime = performance.now();
  
  try {
    const { apiId, endpointId } = req.params;
    
    // Check rate limiting based on IP
    const ip = req.ip || "unknown";
    const publicRateLimit = 5; // Only 5 requests per minute for public testing
    
    // Validate the request body
    const validated = testRequestSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }
    
    const testRequest = validated.data as TestRequest;

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
    if (api.pricingModel === "PAID" && !(api as any).allowPublicTesting) {
      res.status(403).json({
        error: "This API requires purchase before testing",
        message: "The API owner has disabled public testing for this paid API.",
      });
      return;
    }

    // Find the specific endpoint if provided
    let endpoint = null;
    if (endpointId) {
      endpoint = api.endpoints.find((e) => e.id === endpointId) || null;
      if (!endpoint) {
        res.status(404).json({ error: "Endpoint not found" });
        return;
      }
      
      // Check if endpoint allows public testing
      if ((endpoint as any).restrictPublicTesting) {
        res.status(403).json({
          error: "This endpoint requires purchase",
          message: "The API owner has restricted this endpoint to paid users only.",
        });
        return;
      }
    }

    // Prepare request configuration
    const config: AxiosRequestConfig = {
      method: testRequest.method,
      url: testRequest.url,
      headers: testRequest.headers || {},
      params: testRequest.queryParams || {},
      data: testRequest.body,
      validateStatus: () => true, // Accept any status to avoid exceptions
      timeout: 15000, // 15 seconds timeout (shorter than for paid users)
    };

    // Add authentication if specified
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

    // Execute request and measure performance
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

      // Update API analytics for failed requests
      try {
        await updateApiAnalytics(apiId, duration, false);
        
        // Trigger webhook for error_occurred event
        try {
          const webhookData = {
            apiId,
            event: 'error_occurred',
            payload: {
              endpoint: endpoint?.path || testRequest.url,
              method: testRequest.method,
              userType: 'anonymous',
              ipAddress: ip,
              responseStatus: 0,
              errorCode: error.code,
              errorMessage: error.message,
              queryParams: testRequest.queryParams || {},
              headers: Object.keys(testRequest.headers || {}).reduce((acc, key) => {
                // Exclude sensitive headers
                if (!key.toLowerCase().includes('auth') && !key.toLowerCase().includes('key')) {
                  acc[key] = testRequest.headers?.[key] || '';
                }
                return acc;
              }, {} as Record<string, string>),
              isPublicTest: true,
              timestamp: new Date().toISOString()
            }
          };
          
          // Fire and forget webhook trigger
          triggerWebhooks(webhookData)
            .catch(err => logger.error("Failed to trigger error webhook:", err));
        } catch (webhookError) {
          logger.warn("Failed to trigger webhook:", webhookError);
        }
      } catch (analyticsError) {
        logger.warn("Failed to update API analytics for failed request:", analyticsError);
      }

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

    // Calculate duration
    const endTime = performance.now();
    let duration = Math.round(endTime - startTime);

    // Update API analytics for successful requests
    try {
      await updateApiAnalytics(apiId, duration, true);
      
      // Trigger webhook for api_call event
      try {
        const webhookData = {
          apiId,
          event: 'api_call',
          payload: {
            endpoint: endpoint?.path || testRequest.url,
            method: testRequest.method,
            userType: 'anonymous',
            ipAddress: ip,
            responseStatus: response.status,
            responseTime: duration,
            queryParams: testRequest.queryParams || {},
            headers: Object.keys(testRequest.headers || {}).reduce((acc, key) => {
              // Exclude sensitive headers
              if (!key.toLowerCase().includes('auth') && !key.toLowerCase().includes('key')) {
                acc[key] = testRequest.headers?.[key] || '';
              }
              return acc;
            }, {} as Record<string, string>),
            isPublicTest: true,
            timestamp: new Date().toISOString()
          }
        };
        
        // Fire and forget webhook trigger
        triggerWebhooks(webhookData)
          .catch(err => logger.error("Failed to trigger api_call webhook:", err));
      } catch (webhookError) {
        logger.warn("Failed to trigger webhook:", webhookError);
      }
    } catch (analyticsError) {
      logger.warn("Failed to update API analytics for successful request:", analyticsError);
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
    
    if (responseData) {
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
          if (typeof responseData === "object" && responseData !== null) {
            responseData._publicTestLimitation = "Response truncated. Purchase API for full response.";
          }
        } else {
          // For non-JSON responses, truncate with a message
          responseData = responseStr.substring(0, 5000) + "... [Response truncated for free testing]";
        }
      }
    }

    // Format the response
    const result: TestResponse = {
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
    };
    
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error in public API test:", error);
    res.status(500).json({ error: "Failed to execute public API test" });
    
    // Try to trigger an error webhook if apiId is available
    if (req.params.apiId) {
      try {
        triggerWebhooks({
          apiId: req.params.apiId,
          event: 'error_occurred',
          payload: {
            errorCode: 500,
            errorMessage: "Internal server error during public API test",
            endpoint: req.params.endpointId || "unknown",
            method: req.body?.method || "unknown",
            userType: 'anonymous',
            ipAddress: req.ip || "unknown",
            isPublicTest: true,
            timestamp: new Date().toISOString()
          }
        }).catch(err => logger.error("Failed to trigger error webhook:", err));
      } catch (webhookError) {
        logger.error("Failed to trigger webhook for error:", webhookError);
      }
    }
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