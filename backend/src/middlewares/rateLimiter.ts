import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import {logger} from '../utils/logger';

// Rate limiter options interface
interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

// Enhanced Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

// Create rate limiter with Redis store
const createRateLimiter = (options: RateLimiterOptions = {}) => {
  const defaultOptions: RateLimiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    message: 'Too many requests, please try again later.',
  };

  const limiterOptions = { ...defaultOptions, ...options };

  try {
    return rateLimit({
      ...limiterOptions,
      store: new RedisStore({
        // @ts-expect-error - Known issue with type definitions
        sendCommand: (...args: any[]) => redisClient.call(...args),
        prefix: 'ratelimit:',
      }),
      keyGenerator: (req: AuthenticatedRequest) => {
        // Use user ID if authenticated, otherwise IP
        return req.user ? `user:${req.user.id}` : req.ip || '';
      },
      handler: (req: Request, res: Response) => {
        const authReq = req as AuthenticatedRequest;
        logger.warn(`Rate limit exceeded for ${authReq.ip || authReq.user?.id}`);
        return res.status(429).json({
          status: 'error',
          message: limiterOptions.message,
        });
      },
    });
  } catch (error) {
    logger.error(`Redis rate limiter error: ${error instanceof Error ? error.message : String(error)}`);
    // Fallback to memory-based rate limiting if Redis is unavailable
    return rateLimit(limiterOptions);
  }
};

// Specific rate limiters for different routes
const apiRequestLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many API calls, please try again later.',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
});

export { apiRequestLimiter, authLimiter };