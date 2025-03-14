import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Cache TTLs in seconds
export enum CACHE_TTL {
  SHORT = 60, // 1 minute
  MEDIUM = 300, // 5 minutes
  LONG = 1800, // 30 minutes
  VERY_LONG = 86400, // 1 day
}

// Create Redis client with error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
});

// Track Redis connection status
let redisIsReady = false;

// Monitor Redis connection
redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  redisIsReady = true;
  logger.info('Redis ready');
});

redis.on('error', (err) => {
  redisIsReady = false;
  logger.error('Redis connection error:', err);
});

redis.on('close', () => {
  redisIsReady = false;
  logger.warn('Redis connection closed');
});

// Cache data with fallback
export const cacheData = async <T>(key: string, data: T, ttl = CACHE_TTL.MEDIUM): Promise<boolean> => {
  if (!redisIsReady) return false;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
    return true;
  } catch (error) {
    logger.error('Redis caching error:', error);
    return false;
  }
};

// Get cached data with fallback
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  if (!redisIsReady) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error('Redis retrieval error:', error);
    return null;
  }
};

// Delete cache key
export const invalidateCache = async (key: string): Promise<boolean> => {
  if (!redisIsReady) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Redis invalidation error:', error);
    return false;
  }
};

// Delete cache by pattern
export const invalidateCacheByPattern = async (pattern: string): Promise<boolean> => {
  if (!redisIsReady) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis pattern invalidation error:', error);
    return false;
  }
};

// Track API usage with fallback
export const incrementApiUsage = async (apiId: string, userId?: string): Promise<boolean> => {
  if (!redisIsReady) {
    // Log analytics miss for later processing
    logger.warn(`Redis unavailable for API analytics: apiId=${apiId}, userId=${userId || 'anonymous'}`);
    return false;
  }
  try {
    const today = new Date().toISOString().split('T')[0];
    const pipeline = redis.pipeline();
    pipeline.incr(`analytics:api:${apiId}:total`);
    pipeline.incr(`analytics:api:${apiId}:${today}`);
    pipeline.expire(`analytics:api:${apiId}:${today}`, 60 * 60 * 24 * 90); // 90 days
    if (userId) {
      pipeline.sadd(`analytics:api:${apiId}:users:${today}`, userId);
      pipeline.expire(`analytics:api:${apiId}:users:${today}`, 60 * 60 * 24 * 90);
    }
    await pipeline.exec();
    return true;
  } catch (error) {
    logger.error('Redis analytics error:', error);
    return false;
  }
};

// Check if Redis is currently available
export const isRedisAvailable = (): boolean => {
  return redisIsReady;
};

export default redis;