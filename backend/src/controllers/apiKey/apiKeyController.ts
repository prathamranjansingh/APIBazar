// src/controllers/apiKey/apiKeyController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { apiKeySchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
import {
  createApiKey,
  revokeApiKey,
  getUserApiKeys
} from "../../services/apiKeyService";

const prisma = new PrismaClient();

/**
 * Create a new API key
 */
export const createNewApiKey = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { apiId } = req.params;
  try {
    // Validate API key data
    const validated = apiKeySchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId }
    });
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Check if user has purchased this API
    const hasPurchased = await prisma.purchasedAPI.findUnique({
      where: {
        userId_apiId: {
          userId: user.id,
          apiId
        }
      }
    });

    // Only allow key creation for owned or purchased APIs
    if (api.ownerId !== user.id && !hasPurchased) {
      res.status(403).json({
        error: "You must purchase this API before generating an API key"
      });
      return;
    }

    // Parse expiration date if provided
    let expiresAt = null;
    if (validated.data.expiresAt) {
      expiresAt = new Date(validated.data.expiresAt);
    }

    // Create the API key
    const apiKey = await createApiKey({
      userId: user.id,
      apiId,
      name: validated.data.name,
      rateLimit: validated.data.rateLimit || api.rateLimit,
      expiresAt
    });

    res.status(201).json({
      id: apiKey.id,
      key: apiKey.key, // Only return the key once upon creation
      name: apiKey.name,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    logger.error("Error creating API key:", error);
    res.status(500).json({ error: "Failed to create API key" });
  }
};

/**
 * Get API keys for a user
 */
export const getMyApiKeys = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get API keys
    const apiKeys = await getUserApiKeys(user.id);

    // Don't return the actual keys for security
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      apiId: key.apiId,
      apiName: key.api.name,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed
    }));

    res.json(sanitizedKeys);
  } catch (error) {
    logger.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
};

/**
 * Revoke an API key
 */
export const revokeMyApiKey = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { keyId } = req.params;
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Revoke the key
    await revokeApiKey(keyId, user.id);
    res.json({ message: "API key revoked successfully" });
  } catch (error) {
    logger.error("Error revoking API key:", error);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
};

export default {
  createNewApiKey,
  getMyApiKeys,
  revokeMyApiKey
};
