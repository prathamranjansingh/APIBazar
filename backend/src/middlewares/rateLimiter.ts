import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import redis, { isRedisAvailable } from '../config/redis';
import { logger } from '../utils/logger';
import rateLimit from 'express-rate-limit';
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

export const publicLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit to 20 requests per 5 minutes for public access
  standardHeaders: true,
  message: {
  error: 'Public API rate limit exceeded',
  message: 'For higher limits, please register and purchase API access'
  }
  });
  // NEW: Public testing limiter - very restrictive
  export const publicTestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit to 5 test requests per 5 minutes for public testing
  standardHeaders: true,
  message: {
  error: 'Public testing rate limit exceeded',
  message: 'To test APIs more frequently, please register and purchase API access'
  }
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

export const publicDynamicLimiter = (apiId: string, limit: number = 10) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `public:${apiId}:${ip}`;
    try {
      if (!isRedisAvailable()) {
        // If Redis isn't available, fall back to in-memory rate limiting with lower limits
        rateLimit({
          windowMs: 60 * 1000, // 1 minute window
          max: Math.min(limit, 5), // Cap at 5 for safety in fallback mode
          standardHeaders: true,
        })(req, res, next);
        return;
      }
      const rateLimitKey = `ratelimit:${key}`;
      const currentCount = await redis.get(rateLimitKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count - 1).toString());
      res.setHeader('X-Public-Access', 'true');
      if (count >= limit) {
        return res.status(429).json({
          error: 'Public API rate limit exceeded',
          message: `Public access is limited to ${limit} requests per minute per IP`,
          publicAccess: true,
          upgrade: 'Register for an account to get higher rate limits'
        });
      }
      // Increment counter
      if (count === 0) {
        await redis.set(rateLimitKey, '1', 'EX', 60); // 1 minute expiry
      } else {
        await redis.incr(rateLimitKey);
      }
      next();
    } catch (error) {
      logger.error('Public rate limiting error:', error);
      // Continue anyway with a warning header
      res.setHeader('X-Rate-Limit-Warning', 'Rate limiting unavailable');
      next();
    }
  };
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