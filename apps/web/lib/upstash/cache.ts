import { redis } from "./redis";
import { logger } from "@apibazar/utils"; 



export const cacheData = async (key: string, data: any, ttlSeconds: number): Promise<void> => {
  try {
    const serializedData = JSON.stringify(data);
    await redis.set(key, serializedData, { ex: ttlSeconds });
  } catch (error) {
    logger.error(`[CACHE] Failed to set cache`, {
      key,
      error,
    });
  }
};


export const getCachedData = async <T>(key:string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data as string) as T;
  } catch (error) {
    logger.error(`[CACHE] Failed to get cache`, {
      key,
      error,
    });
    return null;
  }
};

export const invalidateCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`[CACHE] Failed to invalidate cache`, {
      key,
      error,
    });
  }
};


export const invalidateCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    let cursor = 0;
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      if (keys.length) {
        keysToDelete.push(...keys);
      }
      cursor = Number(nextCursor);
    } while (cursor !== 0);

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.info(`[CACHE] Invalidated keys by pattern`, {
        pattern,
        count: keysToDelete.length,
      });
    }
  } catch (error) {
    logger.error(`[CACHE] Failed to invalidate cache by pattern`, {
      pattern,
      error,
    });
  }
};