import { Request, Response } from "express";
import { PrismaClient, PricingModel } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { apiSchema, endpointSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
import { createNotification } from "../../services/notificationService";
import { triggerWebhooks } from "../../services/webhookService";
import {
  cacheData,
  getCachedData,
  invalidateCache,
  invalidateCacheByPattern,
  incrementApiUsage,
  isRedisAvailable,
  CACHE_TTL,
} from "../../config/redis";
import Razorpay from "razorpay";
import crypto from "crypto";
import { generateApiKey } from "../../utils/helpers";

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
/**
 * Generate cache key for API listings with filters and pagination
 */
const generateListCacheKey = (query: any): string => {
  const { category, search, page = 1, limit = 10 } = query;
  return `apis:list:${category || "all"}:${search || "none"}:${page}:${limit}`;
};

/**
 * Get all APIs with Redis caching and fallback
 */
export const getAllApis = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only attempt to use cache if Redis is available
    let cachedResult = null;
    const cacheKey = generateListCacheKey(req.query);
    if (isRedisAvailable()) {
      cachedResult = await getCachedData<{
        data: any[];
        pagination: any;
      }>(cacheKey);
      if (cachedResult) {
        res.json(cachedResult);
        return;
      }
    }

    // Cache miss or Redis unavailable - fetch from database
    const category = req.query.category as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Build filter conditions
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [apis, totalCount] = await Promise.all([
      prisma.api.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
          endpoints: {
            select: {
              id: true,
              name: true,
              method: true,
              path: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              purchasedBy: true,
            },
          },
        },
      }),
      prisma.api.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const result = {
      data: apis,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Try to cache the results if Redis is available
    // This operation is non-blocking - we don't need to wait for it
    if (isRedisAvailable()) {
      const ttl = search ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM;
      cacheData(cacheKey, result, ttl).catch((err) => {
        logger.error(`Failed to cache API list results: ${err}`);
      });
    }

    res.json(result);
  } catch (error) {
    logger.error("Error fetching APIs:", error);
    res.status(500).json({ error: "Failed to fetch APIs" });
  }
};

/**
 * Create a new API and invalidate related caches
 */
export const createApi = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const validated = apiSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ error: validated.error.format() });
    return;
  }

  const { pricingModel, price, rateLimit = 100, ...rest } = validated.data;

  // Validate price for PAID models
  if (pricingModel === "PAID" && (price === null || price === undefined)) {
    res.status(400).json({ error: "Price is required for PAID models." });
    return;
  }

  // Added validation for rate limit
  if (rateLimit < 1) {
    res.status(400).json({ error: "Rate limit must be at least 1." });
    return;
  }

  try {
    // Get the user ID from Auth0 ID
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create the API
    const api = await prisma.api.create({
      data: {
        ...rest,
        pricingModel,
        price: pricingModel === "FREE" ? null : price,
        rateLimit,
        ownerId: user.id,
        documentation: validated.data.documentation ?? "",
        // Create analytics record
        analytics: {
          create: {},
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Attempt to invalidate caches if Redis is available
    // Use Promise.all for parallel execution but don't wait for completion
    if (isRedisAvailable()) {
      Promise.all([
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${user.id}:apis`),
      ]).catch((err) => {
        logger.error(`Failed to invalidate caches after API creation: ${err}`);
      });
    }

    logger.info(`API created: ${api.id} by user ${user.id}`);
    res.status(201).json(api);
  } catch (error) {
    logger.error("Error creating API:", error);
    res.status(500).json({ error: "Failed to create API" });
  }
};

/**
 * Get API by ID with Redis caching and fallback
 */
export const getApiById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // Try to get from cache if Redis is available
    let cachedApi = null;
    const cacheKey = `api:${id}`;
    if (isRedisAvailable()) {
      cachedApi = await getCachedData(cacheKey);
      if (cachedApi) {
        res.json(cachedApi);
        return;
      }
    }

    // Cache miss or Redis unavailable - fetch from database
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            picture: true,
            profile: {
              select: {
                bio: true,
              },
            },
          },
        },
        endpoints: {
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            description: true,
            headers: true,
            requestBody: true,
            responseSchema: true,
            rateLimit: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                picture: true,
              },
            },
          },
        },
        analytics: true,
        _count: {
          select: {
            purchasedBy: true,
            reviews: true,
          },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Try to cache the API details if Redis is available
    if (isRedisAvailable()) {
      cacheData(cacheKey, api, CACHE_TTL.MEDIUM).catch((err) => {
        logger.error(`Failed to cache API details: ${err}`);
      });
    }

    res.json(api);
  } catch (error) {
    logger.error("Error fetching API:", error);
    res.status(500).json({ error: "Failed to fetch API" });
  }
};

/**
 * Update an API and attempt to invalidate related caches
 */
export const updateApi = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user owns this API
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        purchasedBy: {
          select: { userId: true },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res
        .status(403)
        .json({ error: "You don't have permission to update this API" });
      return;
    }

    // Validate request data
    const validated = apiSchema.partial().safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    const { pricingModel, price, rateLimit, ...rest } = validated.data;
    const updateData: any = { ...rest };

    // Added validation for rate limit if it's being updated
    if (rateLimit !== undefined && rateLimit < 1) {
      res.status(400).json({ error: "Rate limit must be at least 1." });
      return;
    }

    if (rateLimit !== undefined) {
      updateData.rateLimit = rateLimit;
    }

    // Improved pricing model and price validation
    if (pricingModel !== undefined) {
      updateData.pricingModel = pricingModel;
      if (pricingModel === "PAID") {
        // When changing to PAID, ensure price is set
        if (price === undefined && api.pricingModel === "FREE") {
          res
            .status(400)
            .json({ error: "Price is required when changing to PAID model" });
          return;
        }
        updateData.price = price !== undefined ? price : api.price;
      } else if (pricingModel === "FREE") {
        // When changing to FREE, always set price to null
        updateData.price = null;
      }
    } else if (price !== undefined) {
      // If only price is changing, validate pricing model
      if (api.pricingModel === "FREE") {
        res.status(400).json({ error: "Cannot set price for FREE APIs" });
        return;
      }
      updateData.price = price;
    }

    // Update the API
    const updatedApi = await prisma.api.update({
      where: { id },
      data: updateData,
    });

    // Attempt to invalidate caches if Redis is available
    // Don't block the response on cache operations
    if (isRedisAvailable()) {
      // Collect all purchaser IDs for cache invalidation
      const purchaserIds = api.purchasedBy.map((purchase) => purchase.userId);

      // Create invalidation tasks
      const cacheInvalidationTasks = [
        invalidateCache(`api:${id}`),
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${user.id}:apis`),
      ];

      // Add purchaser cache invalidation tasks
      if (purchaserIds.length > 0) {
        purchaserIds.forEach((userId) => {
          cacheInvalidationTasks.push(
            invalidateCache(`user:${userId}:purchased`)
          );
        });
      }

      // Execute all cache invalidation tasks in parallel but don't wait
      Promise.all(cacheInvalidationTasks).catch((err) => {
        logger.error(`Failed to invalidate caches after API update: ${err}`);
      });
    }

    // Notify users who purchased this API about the update
    if (api.purchasedBy.length > 0) {
      const purchaserIds = api.purchasedBy.map((purchase) => purchase.userId);

      // Create notifications for each user
      Promise.all(
        purchaserIds.map((userId) =>
          createNotification({
            userId,
            type: "API_UPDATED",
            title: "API Updated",
            message: `The API "${updatedApi.name}" that you purchased has been updated.`,
            data: { apiId: updatedApi.id },
          })
        )
      ).catch((err) => {
        logger.error(`Failed to create notifications for API update: ${err}`);
      });

      // Trigger webhooks for API update event
      triggerWebhooks({
        apiId: updatedApi.id,
        event: "API_UPDATED",
        payload: { api: updatedApi },
      }).catch((err) => {
        logger.error(`Failed to trigger webhooks for API update: ${err}`);
      });
    }

    res.json(updatedApi);
  } catch (error) {
    logger.error("Error updating API:", error);
    res.status(500).json({ error: "Failed to update API" });
  }
};

/**
 * Delete an API and attempt to invalidate related caches
 */
export const deleteApi = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user owns this API and get purchasers for cache invalidation
    const api = await prisma.api.findUnique({
      where: { id },
      include: {
        purchasedBy: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res
        .status(403)
        .json({ error: "You don't have permission to delete this API" });
      return;
    }

    // Delete the API (cascading will handle related records)
    await prisma.api.delete({
      where: { id },
    });

    // Attempt to invalidate caches if Redis is available
    if (isRedisAvailable()) {
      // Collect all purchaser IDs for cache invalidation
      const purchaserIds = api.purchasedBy.map((purchase) => purchase.userId);

      // Create invalidation tasks
      const cacheInvalidationTasks = [
        invalidateCache(`api:${id}`),
        invalidateCacheByPattern("apis:list:*"),
        invalidateCache(`user:${user.id}:apis`),
      ];

      // Add purchaser cache invalidation tasks
      if (purchaserIds.length > 0) {
        purchaserIds.forEach((userId) => {
          cacheInvalidationTasks.push(
            invalidateCache(`user:${userId}:purchased`)
          );
        });
      }

      // Execute all cache invalidation tasks in parallel but don't block response
      Promise.all(cacheInvalidationTasks).catch((err) => {
        logger.error(`Failed to invalidate caches after API deletion: ${err}`);
      });
    }

    res.json({ message: "API deleted successfully" });
  } catch (error) {
    logger.error("Error deleting API:", error);
    res.status(500).json({ error: "Failed to delete API" });
  }
};

/**
 * Get APIs created by the authenticated user with Redis caching and fallback
 */
export const getMyApis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Try to get from cache if Redis is available
    let cachedApis = null;
    const cacheKey = `user:${user.id}:apis`;
    if (isRedisAvailable()) {
      cachedApis = await getCachedData(cacheKey);
      if (cachedApis) {
        res.json(cachedApis);
        return;
      }
    }

    // Cache miss or Redis unavailable - fetch from database
    const apis = await prisma.api.findMany({
      where: { ownerId: user.id },
      include: {
        endpoints: true,
        _count: {
          select: {
            purchasedBy: true,
          },
        },
        analytics: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Try to cache the result if Redis is available
    if (isRedisAvailable()) {
      cacheData(cacheKey, apis, CACHE_TTL.MEDIUM).catch((err) => {
        logger.error(`Failed to cache user's APIs: ${err}`);
      });
    }

    res.json(apis);
  } catch (error) {
    logger.error("Error fetching user's APIs:", error);
    res.status(500).json({ error: "Failed to fetch your APIs" });
  }
};

/**
 * Get APIs purchased by the current user with Redis caching and fallback
 */
export const getPurchasedApis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Try to get from cache if Redis is available
    let cachedApis = null;
    const cacheKey = `user:${user.id}:purchased`;
    if (isRedisAvailable()) {
      cachedApis = await getCachedData(cacheKey);
      if (cachedApis) {
        res.json(cachedApis);
        return;
      }
    }

    // Cache miss or Redis unavailable - fetch from database
    const purchasedApis = await prisma.purchasedAPI.findMany({
      where: { userId: user.id },
      include: {
        api: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
            endpoints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Extract just the APIs from the purchased records
    const apis = purchasedApis.map((purchase) => purchase.api);

    // Try to cache the result if Redis is available
    if (isRedisAvailable()) {
      cacheData(cacheKey, apis, CACHE_TTL.LONG).catch((err) => {
        logger.error(`Failed to cache purchased APIs: ${err}`);
      });
    }

    res.json(apis);
  } catch (error) {
    logger.error("Error fetching purchased APIs:", error);
    res.status(500).json({ error: "Failed to fetch your purchased APIs" });
  }
};

/**
 * Add an endpoint to an API and attempt to invalidate API caches
 */
export const addEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId } = req.params;

  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user owns this API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: {
        ownerId: true,
        purchasedBy: {
          select: { userId: true },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res
        .status(403)
        .json({ error: "You don't have permission to modify this API" });
      return;
    }

    // Validate endpoint data
    const validated = endpointSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Added validation for endpoint rate limit if specified
    if (
      validated.data.rateLimit !== undefined &&
      validated.data.rateLimit < 1
    ) {
      res
        .status(400)
        .json({ error: "Endpoint rate limit must be at least 1." });
      return;
    }

    // Check for duplicate endpoint path+method
    const existingEndpoint = await prisma.endpoint.findFirst({
      where: {
        apiId,
        path: validated.data.path,
        method: validated.data.method,
      },
    });

    if (existingEndpoint) {
      res.status(400).json({
        error: `Endpoint with method ${validated.data.method} and path ${validated.data.path} already exists`,
      });
      return;
    }

    // Create the endpoint
    const endpoint = await prisma.endpoint.create({
      data: {
        ...validated.data,
        apiId,
      },
    });

    // Attempt to invalidate related API caches if Redis is available
    if (isRedisAvailable()) {
      const cacheInvalidationTasks = [
        invalidateCache(`api:${apiId}`),
        invalidateCache(`user:${user.id}:apis`),
      ];

      // Add purchaser cache invalidation if the API has been purchased
      if (api.purchasedBy && api.purchasedBy.length > 0) {
        api.purchasedBy.forEach((purchase) => {
          cacheInvalidationTasks.push(
            invalidateCache(`user:${purchase.userId}:purchased`)
          );
        });
      }

      // Execute all cache invalidation tasks in parallel but don't block response
      Promise.all(cacheInvalidationTasks).catch((err) => {
        logger.error(
          `Failed to invalidate caches after endpoint creation: ${err}`
        );
      });
    }

    res.status(201).json(endpoint);
  } catch (error) {
    logger.error("Error adding endpoint:", error);
    res.status(500).json({ error: "Failed to add endpoint" });
  }
};

/**
 * Update an endpoint and attempt to invalidate related caches
 */
export const updateEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId, endpointId } = req.params;

  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user owns the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: {
        ownerId: true,
        purchasedBy: {
          select: { userId: true },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res
        .status(403)
        .json({ error: "You don't have permission to modify this API" });
      return;
    }

    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint || endpoint.apiId !== apiId) {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }

    // Validate endpoint data
    const validated = endpointSchema.partial().safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Added validation for endpoint rate limit if specified
    if (
      validated.data.rateLimit !== undefined &&
      validated.data.rateLimit < 1
    ) {
      res
        .status(400)
        .json({ error: "Endpoint rate limit must be at least 1." });
      return;
    }

    const { path, method } = validated.data;

    // If path or method is being updated, check for conflicts
    if (
      (path && path !== endpoint.path) ||
      (method && method !== endpoint.method)
    ) {
      const existingEndpoint = await prisma.endpoint.findFirst({
        where: {
          apiId,
          path: path || endpoint.path,
          method: method || endpoint.method,
          NOT: { id: endpointId },
        },
      });

      if (existingEndpoint) {
        res.status(400).json({
          error: `Another endpoint with method ${method || endpoint.method} and path ${path || endpoint.path} already exists`,
        });
        return;
      }
    }

    // Update the endpoint
    const updatedEndpoint = await prisma.endpoint.update({
      where: { id: endpointId },
      data: validated.data,
    });

    // Attempt to invalidate related API caches if Redis is available
    if (isRedisAvailable()) {
      const cacheInvalidationTasks = [
        invalidateCache(`api:${apiId}`),
        invalidateCache(`user:${user.id}:apis`),
      ];

      // Add purchaser cache invalidation if the API has been purchased
      if (api.purchasedBy && api.purchasedBy.length > 0) {
        api.purchasedBy.forEach((purchase) => {
          cacheInvalidationTasks.push(
            invalidateCache(`user:${purchase.userId}:purchased`)
          );
        });
      }

      // Execute all cache invalidation tasks in parallel but don't block response
      Promise.all(cacheInvalidationTasks).catch((err) => {
        logger.error(
          `Failed to invalidate caches after endpoint update: ${err}`
        );
      });
    }

    // Trigger webhooks for endpoint update - don't block response
    triggerWebhooks({
      apiId,
      event: "ENDPOINT_UPDATED",
      payload: { endpoint: updatedEndpoint },
    }).catch((err) => {
      logger.error(`Failed to trigger webhooks for endpoint update: ${err}`);
    });

    res.json(updatedEndpoint);
  } catch (error) {
    logger.error("Error updating endpoint:", error);
    res.status(500).json({ error: "Failed to update endpoint" });
  }
};

/**
 * Delete an endpoint and attempt to invalidate related caches
 */
export const deleteEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId, endpointId } = req.params;

  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user owns the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: {
        ownerId: true,
        purchasedBy: {
          select: { userId: true },
        },
      },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res
        .status(403)
        .json({ error: "You don't have permission to modify this API" });
      return;
    }

    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint || endpoint.apiId !== apiId) {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }

    // Delete the endpoint
    await prisma.endpoint.delete({
      where: { id: endpointId },
    });

    // Attempt to invalidate related API caches if Redis is available
    if (isRedisAvailable()) {
      const cacheInvalidationTasks = [
        invalidateCache(`api:${apiId}`),
        invalidateCache(`user:${user.id}:apis`),
      ];

      // Add purchaser cache invalidation if the API has been purchased
      if (api.purchasedBy && api.purchasedBy.length > 0) {
        api.purchasedBy.forEach((purchase) => {
          cacheInvalidationTasks.push(
            invalidateCache(`user:${purchase.userId}:purchased`)
          );
        });
      }

      // Execute all cache invalidation tasks in parallel but don't block response
      Promise.all(cacheInvalidationTasks).catch((err) => {
        logger.error(
          `Failed to invalidate caches after endpoint deletion: ${err}`
        );
      });
    }

    res.json({ message: "Endpoint deleted successfully" });
  } catch (error) {
    logger.error("Error deleting endpoint:", error);
    res.status(500).json({ error: "Failed to delete endpoint" });
  }
};

/**
 * Handles the purchase of an API (Express route handler)
 */
export const purchaseApi = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.auth?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { apiId } = req.params;

    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if already purchased
    const existingPurchase = await prisma.transaction.findFirst({
      where: {
        buyerId: user.id,
        apiId: apiId,
        status: "completed",
      },
    });

    if (existingPurchase) {
      res.status(400).json({ error: "API already purchased" });
      return;
    }

    const result = await purchaseApiTransaction(apiId, user.id);
    res.json(result);
  } catch (error: any) {
    logger.error("Error purchasing API:", error);
    res.status(500).json({ error: error.message || "Failed to purchase API" });
  }
};

/**
 * Business logic for purchasing an API (not an Express handler)
 */
export const purchaseApiTransaction = async (
  apiId: string,
  buyerId: string
) => {
  const api = await prisma.api.findUnique({
    where: { id: apiId },
    include: { owner: true },
  });

  if (!api || api.pricingModel !== "PAID" || !api.price) {
    throw new Error("API not found or not for sale");
  }

  const seller = api.owner;
  if (!seller.razorpayAccountId) {
    throw new Error("Seller has not linked their Razorpay account");
  }

  // Check seller account status
  const sellerAccount = await razorpay.accounts.fetch(seller.razorpayAccountId);
  if (sellerAccount.status !== "activated") {
    throw new Error("Seller account is not activated for receiving payments");
  }

  const amount = api.price;
  const platformFee = amount * 0.15;
  const sellerPayout = amount - platformFee;
  const tds = sellerPayout * 0.1;
  const sellerReceives = sellerPayout - tds;

  // Create Razorpay order WITHOUT transfers (we'll handle transfers after payment)
  const payment = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    receipt: `api_purchase_${apiId}_${Date.now()}`,
    notes: {
      sellerId: seller.id,
      buyerId,
      apiId,
      sellerAmount: Math.round(sellerReceives * 100),
      platformFee: Math.round(platformFee * 100),
    },
  });

  // Save transaction in DB with pending status
  const transaction = await prisma.transaction.create({
    data: {
      buyerId,
      sellerId: seller.id,
      apiId: api.id,
      amount,
      platformFee,
      tds,
      sellerReceives,
      status: "pending",
      paymentId: payment.id,
      razorpayOrderId: payment.id,
    },
  });

  return {
    success: true,
    orderId: payment.id,
    amount: Math.round(amount * 100), // Return in paise for frontend
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID,
    name: "Your Platform Name",
    description: `Purchase API: ${api.name}`,
    prefill: {
      email: seller.email, // You might want buyer's email here
    },
  };
};

export const verifyPayment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    // Find transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        status: "pending",
      },
      include: {
        api: true,
        seller: true,
      },
    });

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "completed",
        razorpayPaymentId: razorpay_payment_id,
        completedAt: new Date(),
      },
    });

    // Process seller transfer
    await processSellertransfer(transaction, razorpay_payment_id);

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error: any) {
    logger.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// 4. Process Seller Transfer
export const processSellertransfer = async (
  transaction: any,
  paymentId: string
) => {
  try {
    // Create transfer to seller
    const transfer = await razorpay.transfers.create({
      account: transaction.seller.razorpayAccountId,
      amount: Math.round(transaction.sellerReceives * 100),
      currency: "INR",
      notes: {
        transactionId: transaction.id,
        apiId: transaction.apiId,
        type: "api_sale_payout",
      },
    });

    // Update transaction with transfer details
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        transferId: transfer.id,
        transferStatus: "completed",
      },
    });

    logger.info(`Transfer created successfully: ${transfer.id}`);
  } catch (error: any) {
    logger.error("Error processing seller transfer:", error);

    // Update transaction with transfer failure
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        transferStatus: "failed",
        transferError: error.message,
      },
    });

    // You might want to implement retry logic here
    throw error;
  }
};

export default {
  getAllApis,
  createApi,
  getApiById,
  updateApi,
  deleteApi,
  getMyApis,
  getPurchasedApis,
  addEndpoint,
  updateEndpoint,
  deleteEndpoint,
  purchaseApi,
  purchaseApiTransaction,
};
