// src/services/apiKeyService.ts
import { PrismaClient } from "@prisma/client";
import { ApiKeyData } from "../utils/types";
import { generateApiKey } from "../utils/helpers";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();
/**
 * By default, Express's Request type does not include custom properties like apiKey, consumerId, or apiId.
 * TypeScript will throw errors when you try to access them unless you explicitly extend the Request type.
 */

declare module "express-serve-static-core" {
  interface Request {
    apiKey?: ApiKeyData;
    consumerId?: string;
    apiId?: string;
  }
}

/**
 * Create a new API key.
 * Generates a key, saves it in the database, and returns it.
 */
export const createApiKey = async (data: ApiKeyData) => {
  try {
    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        userId: data.userId,
        apiId: data.apiId,
        name: data.name || `API Key ${new Date().toISOString()}`,
        rateLimit: data.rateLimit || 100, // Default: 100 requests/hour
        expiresAt: data.expiresAt || null
      }
    });

    return apiKey;
  } catch (error) {
    logger.error("Error creating API key:", error);
    throw error;
  }
};

/**
 * Revoke an API key.
 * Ensures the key belongs to the user before revoking.
 */
export const revokeApiKey = async (keyId: string, userId: string) => {
  try {
    // Verify ownership
    const key = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId
      }
    });

    if (!key) {
      throw new Error("API key not found or unauthorized");
    }

    // Revoke key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false
      }
    });

    return { success: true };
  } catch (error) {
    logger.error("Error revoking API key:", error);
    throw error;
  }
};

/**
 * Get all API keys for a user.
 * Returns API keys along with the associated API details.
 */
export const getUserApiKeys = async (userId: string) => {
  try {
    return await prisma.apiKey.findMany({
      where: { userId },
      include: {
        api: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  } catch (error) {
    logger.error("Error fetching user API keys:", error);
    return [];
  }
};

/**
 * Validate an API key.
 * Checks if the key exists, is active, and is not expired.
 */
export const validateApiKey = async (key: string) => {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        api: {
          select: {
            id: true,
            name: true,
            rateLimit: true
          }
        }
      }
    });

    if (!apiKey) {
      return { valid: false, reason: "Invalid API key" };
    }

    if (!apiKey.isActive) {
      return { valid: false, reason: "API key is inactive" };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, reason: "API key has expired" };
    }

    return {
      valid: true,
      apiKey
    };
  } catch (error) {
    logger.error("Error validating API key:", error);
    return { valid: false, reason: "Error validating API key" };
  }
};
