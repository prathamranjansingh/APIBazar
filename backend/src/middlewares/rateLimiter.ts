// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from "express";
import { RateLimitOptions } from "../utils/types";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { createNotification } from "../services/notificationService";

const prisma = new PrismaClient();

// In-memory store for global rate limiting (should use Redis in production)
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {};

/**
 * Global rate limiter middleware
 * Limits requests from a single IP within a specified time window.
 */
export const globalRateLimiter = (options: RateLimitOptions) => {
  const { maxRequests, windowMs, message = "Too many requests, please try again later" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `global:${ip}`;
    const now = Date.now();

    // Initialize or reset rate limit for the IP
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      next();
      return;
    }

    // Check if request limit is exceeded
    if (rateLimitStore[key].count >= maxRequests) {
      res.status(429).json({ error: message });
      return;
    }

    // Increment request count and continue
    rateLimitStore[key].count++;
    next();
  };
};

/**
 * API Key-based rate limiter middleware
 * Enforces per-hour request limits based on API keys.
 */
export const apiKeyRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.apiKey) {
    return next(); // No API key, skip rate limiting
  }

  try {
    const apiKeyId = req.apiKey.apiId;
    const apiKey = req.apiKey;
    const rateLimit = apiKey.rateLimit ?? 1000;;
    const endpoint = req.path;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";

    // Calculate start of the current hour for rate limit window
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    // Count the number of requests made with this API key in the current hour
    const usageCount = await prisma.rateLimitLog.count({
      where: {
        apiKeyId,
        timestamp: { gte: hourStart }
      }
    });

    // If the limit is exceeded, return a 429 response
    if (usageCount >= rateLimit) {
      logger.warn(`Rate limit exceeded for API key: ${apiKeyId}, endpoint: ${endpoint}`);
      
    if (!req.consumerId || !req.apiId) {
        return res.status(400).json({ error: "Missing consumerId or apiId" });
      }
      // Notify the user about the rate limit breach
      await createNotification({
        userId: req.consumerId,
        type: "RATE_LIMIT_REACHED",
        title: "Rate Limit Reached",
        message: "You've reached the rate limit for the API. The limit will reset in the next hour.",
        data: { apiId: req.apiId }
      });

      return res.status(429).json({
        error: "Rate limit exceeded",
        limit: rateLimit,
        current: usageCount,
        resetsAt: new Date(hourStart.getTime() + 3600000).toISOString()
      });
    }

    // Log the request for future rate limit checks
    await prisma.rateLimitLog.create({
      data: {
        apiKeyId,
        timestamp: now,
        endpoint,
        ip: ip.toString().substring(0, 50) // Limit string length for database storage
      }
    });

    next();
  } catch (error) {
    logger.error("Error in API key rate limiter:", error);
    next(); // Continue even if rate limiting fails
  }
};
