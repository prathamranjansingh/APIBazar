import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redis, { isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';

// Memory-based fallback rate limiters
const memoryRateLimiter = new RateLimiterMemory({
  points: 60, // Maximum number of requests
  duration: 60, // Per minute
});

const memoryAuthLimiter = new RateLimiterMemory({
  points: 5, // Maximum number of requests
  duration: 60, // Per minute
});

// Create Redis-based rate limiter with memory fallback
interface RateLimiterOptions {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
}

const createRedisRateLimiter = (options: RateLimiterOptions) => {
  if (isRedisAvailable()) {
    try {
      return new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: options.keyPrefix,
        points: options.points,
        duration: options.duration,
        blockDuration: options.blockDuration,
        inMemoryBlockOnConsumed: options.points + 1, // Fixed property name
        inMemoryBlockDuration: options.blockDuration || options.duration,
        insuranceLimiter: memoryRateLimiter,
      });
    } catch (error) {
      logger.error(
        `Failed to create Redis rate limiter: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      // Fall back to memory limiter
      return memoryRateLimiter;
    }
  }
  // Redis not available, use memory limiter
  return memoryRateLimiter;
};

// Base rate limiter for all API endpoints
const apiRateLimiter = createRedisRateLimiter({
  keyPrefix: 'ratelimit:api:',
  points: 60, // Maximum number of requests
  duration: 60, // Per minute
  blockDuration: 60 * 2, // Block for 2 minutes if exceeded
});

// Stricter rate limiter for authentication
const authRateLimiter = createRedisRateLimiter({
  keyPrefix: 'ratelimit:auth:',
  points: 5, // Maximum number of requests
  duration: 60, // Per minute
  blockDuration: 60 * 15, // Block for 15 minutes if exceeded
});

// Dynamic rate limiter for API usage based on purchased API's limits
export const createDynamicRateLimiter = (apiId: string, limit: number) => {
  return createRedisRateLimiter({
    keyPrefix: `ratelimit:usage:${apiId}:`,
    points: limit,
    duration: 60, // Per minute
    blockDuration: 60, // Block for 1 minute if exceeded
  });
};

// Middleware for general API rate limiting
export const apiLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP address as identifier
    const key = req.ip || 'unknown';
    await apiRateLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Rate limiter error for IP ${req.ip}:`, error);
      res.status(500).json({ error: 'Server error during rate limiting' });
    } else {
      // RateLimiterRes from rate-limiter-flexible
      const retryAfter = Math.floor((error as any).msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }
  }
};

// Middleware for authentication rate limiting
export const authLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use IP address as identifier
    const key = req.ip || 'unknown';
    await authRateLimiter.consume(key);
    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Auth rate limiter error for IP ${req.ip}:`, error);
      res.status(500).json({ error: 'Server error during rate limiting' });
    } else {
      const retryAfter = Math.floor((error as any).msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many authentication attempts, please try again later',
        retryAfter,
      });
    }
  }
};

// Middleware for dynamic API usage rate limiting
export const dynamicApiLimiter = (apiId: string, limit: number) => {
  const limiter = createDynamicRateLimiter(apiId, limit);
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use user ID or API key as identifier
      const key = (req.headers['x-api-key'] as string) || req.ip || 'unknown';
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`API usage rate limiter error for API ${apiId}:`, error);
        // Continue without rate limiting if there's a server error
        next();
      } else {
        const retryAfter = Math.floor((error as any).msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(retryAfter));
        res.status(429).json({
          error: 'Rate limit exceeded for this API',
          retryAfter,
        });
      }
    }
  };
};