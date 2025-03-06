import { Request, Response } from "express";
import { PrismaClient, PricingModel } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { apiSchema, endpointSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
import { createNotification } from "../../services/notificationService";
import { triggerWebhooks } from "../../services/webhookService";
// Removed unused import
const prisma = new PrismaClient();

export const getAllApis = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query parameters
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
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
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
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              picture: true
            }
          },
          endpoints: {
            select: {
              id: true,
              name: true,
              method: true,
              path: true
            }
          },
          _count: {
            select: {
              reviews: true,
              purchasedBy: true
            }
          }
        }
      }),
      prisma.api.count({ where })
    ]);
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    res.json({
      data: apis,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error("Error fetching APIs:", error);
    res.status(500).json({ error: "Failed to fetch APIs" });
  }
};

/**
 * Create a new API
 */
export const createApi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      where: { auth0Id: req.auth.sub }
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
          create: {}
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    logger.info(`API created: ${api.id} by user ${user.id}`);
    res.status(201).json(api);
  } catch (error) {
    logger.error("Error creating API:", error);
    res.status(500).json({ error: "Failed to create API" });
  }
};

/**
 * Get API by ID
 */
export const getApiById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
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
                bio: true
              }
            }
          }
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
            rateLimit: true
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                picture: true
              }
            }
          }
        },
        analytics: true,
        _count: {
          select: {
            purchasedBy: true,
            reviews: true
          }
        }
      }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    res.json(api);
  } catch (error) {
    logger.error("Error fetching API:", error);
    res.status(500).json({ error: "Failed to fetch API" });
  }
};

/**
 * Update an API
 */
export const updateApi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
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
          select: { userId: true }
        }
      }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to update this API" });
      return;
    }
    // Validate request data
    const validated = apiSchema.partial().safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }
    const { pricingModel, price, rateLimit, ...rest } = validated.data;
    // Create update data object
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
          res.status(400).json({ error: "Price is required when changing to PAID model" });
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
      data: updateData
    });

    // Notify users who purchased this API about the update
    if (api.purchasedBy.length > 0) {
      const purchaserIds = api.purchasedBy.map(purchase => purchase.userId);
      // Create notifications for each user
      await Promise.all(
        purchaserIds.map(userId =>
          createNotification({
            userId,
            type: "API_UPDATED",
            title: "API Updated",
            message: `The API "${updatedApi.name}" that you purchased has been updated.`,
            data: { apiId: updatedApi.id }
          })
        )
      );
      // Trigger webhooks for API update event
      await triggerWebhooks({
        apiId: updatedApi.id,
        event: "API_UPDATED",
        payload: { api: updatedApi }
      });
    }
    res.json(updatedApi);
  } catch (error) {
    logger.error("Error updating API:", error);
    res.status(500).json({ error: "Failed to update API" });
  }
};

/**
 * Delete an API
 */
export const deleteApi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Check if user owns this API
    const api = await prisma.api.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerId: true
      }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to delete this API" });
      return;
    }
    // Delete the API (cascading will handle related records)
    await prisma.api.delete({
      where: { id }
    });
    res.json({ message: "API deleted successfully" });
  } catch (error) {
    logger.error("Error deleting API:", error);
    res.status(500).json({ error: "Failed to delete API" });
  }
};

/**
 * Get APIs created by the current user
 */
export const getMyApis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const apis = await prisma.api.findMany({
      where: { ownerId: user.id },
      include: {
        endpoints: true,
        _count: {
          select: {
            purchasedBy: true
          }
        },
        analytics: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(apis);
  } catch (error) {
    logger.error("Error fetching user's APIs:", error);
    res.status(500).json({ error: "Failed to fetch your APIs" });
  }
};

/**
 * Get APIs purchased by the current user
 */
export const getPurchasedApis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const purchasedApis = await prisma.purchasedAPI.findMany({
      where: { userId: user.id },
      include: {
        api: {
          include: {
            owner: {
              select: {
                id: true,
                name: true
              }
            },
            endpoints: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Extract just the APIs from the purchased records
    const apis = purchasedApis.map(purchase => purchase.api);
    res.json(apis);
  } catch (error) {
    logger.error("Error fetching purchased APIs:", error);
    res.status(500).json({ error: "Failed to fetch your purchased APIs" });
  }
};

/**
 * Add an endpoint to an API
 */
export const addEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { apiId } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Check if user owns this API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to modify this API" });
      return;
    }
    // Validate endpoint data
    const validated = endpointSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }
    
    // Added validation for endpoint rate limit if specified
    if (validated.data.rateLimit !== undefined && validated.data.rateLimit < 1) {
      res.status(400).json({ error: "Endpoint rate limit must be at least 1." });
      return;
    }
    
    // Check for duplicate endpoint path+method
    const existingEndpoint = await prisma.endpoint.findFirst({
      where: {
        apiId,
        path: validated.data.path,
        method: validated.data.method
      }
    });
    if (existingEndpoint) {
      res.status(400).json({
        error: `Endpoint with method ${validated.data.method} and path ${validated.data.path} already exists`
      });
      return;
    }
    // Create the endpoint
    const endpoint = await prisma.endpoint.create({
      data: {
        ...validated.data,
        apiId
      }
    });
    res.status(201).json(endpoint);
  } catch (error) {
    logger.error("Error adding endpoint:", error);
    res.status(500).json({ error: "Failed to add endpoint" });
  }
};

/**
 * Update an endpoint
 */
export const updateEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { apiId, endpointId } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Check if user owns the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to modify this API" });
      return;
    }
    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId }
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
    if (validated.data.rateLimit !== undefined && validated.data.rateLimit < 1) {
      res.status(400).json({ error: "Endpoint rate limit must be at least 1." });
      return;
    }
    
    const { path, method } = validated.data;
    // If path or method is being updated, check for conflicts
    if ((path && path !== endpoint.path) || (method && method !== endpoint.method)) {
      const existingEndpoint = await prisma.endpoint.findFirst({
        where: {
          apiId,
          path: path || endpoint.path,
          method: method || endpoint.method,
          NOT: { id: endpointId }
        }
      });
      if (existingEndpoint) {
        res.status(400).json({
          error: `Another endpoint with method ${method || endpoint.method} and path ${path || endpoint.path} already exists`
        });
        return;
      }
    }
    // Update the endpoint
    const updatedEndpoint = await prisma.endpoint.update({
      where: { id: endpointId },
      data: validated.data
    });
    // Trigger webhooks for endpoint update
    await triggerWebhooks({
      apiId,
      event: "ENDPOINT_UPDATED",
      payload: { endpoint: updatedEndpoint }
    });
    res.json(updatedEndpoint);
  } catch (error) {
    logger.error("Error updating endpoint:", error);
    res.status(500).json({ error: "Failed to update endpoint" });
  }
};

/**
 * Delete an endpoint
 */
export const deleteEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { apiId, endpointId } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Check if user owns the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to modify this API" });
      return;
    }
    // Check if endpoint exists
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId }
    });
    if (!endpoint || endpoint.apiId !== apiId) {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }
    // Delete the endpoint
    await prisma.endpoint.delete({
      where: { id: endpointId }
    });
    res.json({ message: "Endpoint deleted successfully" });
  } catch (error) {
    logger.error("Error deleting endpoint:", error);
    res.status(500).json({ error: "Failed to delete endpoint" });
  }
};

/**
 * Purchase an API
 */
export const purchaseApi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { apiId } = req.params;
  try {
    // Get user from auth0Id
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Check if API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: {
        owner: true
      }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    // Check if user already purchased this API
    const existingPurchase = await prisma.purchasedAPI.findUnique({
      where: {
        userId_apiId: {
          userId: user.id,
          apiId
        }
      }
    });
    if (existingPurchase) {
      res.status(400).json({ error: "You have already purchased this API" });
      return;
    }
    // Can't purchase your own API
    if (api.ownerId === user.id) {
      res.status(400).json({ error: "You cannot purchase your own API" });
      return;
    }
    
    // Generate API key with a more secure method
    const generateApiKey = (): string => {
      const prefix = apiId.substring(0, 8);
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      return `${prefix}_${timestamp}_${random}`;
    };
    
    const apiKeyValue = generateApiKey();
    
    // Start transaction for purchase
    const [purchase, transaction, apiKey] = await prisma.$transaction([
      // Record the purchase
      prisma.purchasedAPI.create({
        data: {
          userId: user.id,
          apiId
        }
      }),
      // Create transaction record
      prisma.transaction.create({
        data: {
          buyerId: user.id,
          sellerId: api.ownerId,
          apiId,
          amount: api.price || 0
        }
      }),
      // Generate API key
      prisma.apiKey.create({
        data: {
          userId: user.id,
          apiId,
          key: apiKeyValue,
          name: `${api.name} Key`,
          rateLimit: api.rateLimit
        }
      })
    ]);
    
    // Send notifications
    await Promise.all([
      // Notify the buyer
      createNotification({
        userId: user.id,
        type: "PURCHASE_CONFIRMED",
        title: "API Purchase Successful",
        message: `You have successfully purchased access to ${api.name}`,
        data: { apiId, transactionId: transaction.id }
      }),
      // Notify the seller
      createNotification({
        userId: api.ownerId,
        type: "API_PURCHASED",
        title: "Your API Was Purchased",
        message: `Someone has purchased access to your API: ${api.name}`,
        data: { apiId, transactionId: transaction.id }
      })
    ]);
    
    // Trigger webhooks
    await triggerWebhooks({
      apiId,
      event: "API_PURCHASED",
      payload: {
        apiId,
        buyerId: user.id,
        transactionId: transaction.id
      }
    });
    
    res.status(201).json({
      message: "API purchased successfully",
      purchase,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key
      }
    });
  } catch (error) {
    logger.error("Error purchasing API:", error);
    res.status(500).json({ error: "Failed to purchase API" });
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
  purchaseApi
};