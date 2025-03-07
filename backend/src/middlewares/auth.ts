import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../utils/types";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
dotenv.config();
const prisma = new PrismaClient();

/**
 * Middleware to validate JWT tokens using Auth0.
 * Ensures only authenticated users can access protected routes.
 */
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }) as any,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"]
});

export const ensureUserExists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth?.sub) {
    return next();
  }
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
logger.warn(`User not found in database: ${req.auth.sub}`);
      return res.status(401).json({
        error: "User not found in database",
        code: "user_not_synced"
      });
    }
    // Add user ID to request
    req.userId = user.id;
    next();
  } catch (error) {
logger.error(`Error ensuring user exists: ${error}`);
    next(error);
  }
};

/**
 * Middleware to check if the authenticated user is the owner of the API.
 * Ensures only the API creator can modify or delete it.
 */
export const checkApiOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { apiId } = req.params;

    // Retrieve user from the database using Auth0 ID
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user owns the API
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });

    if (!api) {
      return res.status(404).json({ error: "API not found" });
    }

    if (api.ownerId !== user.id) {
      return res.status(403).json({ error: "You don't have permission to modify this API" });
    }

    // User is the owner, attach user info to request and continue
    req.user = user;
    next();
  } catch (error) {
    logger.error("Error checking API ownership:", error);
    return res.status(500).json({ error: "Error verifying ownership" });
  }
};

/**
 * Middleware to verify API keys for external API consumers.
 * Ensures that only valid and active API keys can access protected routes.
 */
export const verifyApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.header("X-API-Key");

  if (!apiKey) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    // Find the API key in the database
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        api: true,
        user: true
      }
    });

    if (!keyData) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    if (!keyData.isActive) {
      return res.status(403).json({ error: "API key is inactive" });
    }

    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return res.status(403).json({ error: "API key has expired" });
    }

    // Attach API key details to request for further use
    req.apiKey = keyData;
    req.apiId = keyData.apiId;
    req.consumerId = keyData.userId;

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: keyData.id },
      data: { lastUsed: new Date() }
    });

    next();
  } catch (error) {
    logger.error("Error verifying API key:", error);
    return res.status(500).json({ error: "Error verifying API key" });
  }
};






export const authErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid or missing token" });
  }
  next(err);
};


