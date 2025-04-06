import { Logger } from "~/utils/logger.server";
import { redis, safeRedisOperation } from "~/services/redis.server";

const DEFAULT_CACHE_TTL = 3600; // 1 hour

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<T> {
  Logger.info({
    message: `Getting cached data for key: ${key}`,
    metadata: {
      key,
    },
  });
  try {
    // Try to get data from cache first
    const cached = await safeRedisOperation(() => redis.get(key));
    if (cached) {
      return JSON.parse(cached as string);
    }

    // If not in cache, fetch fresh data
    const freshData = await fetchFn();

    // Store in cache
    await safeRedisOperation(() =>
      redis.set(key, JSON.stringify(freshData), { ex: ttlSeconds })
    );

    return freshData;
  } catch (error) {
    // If Redis fails, fallback to direct fetch

    Logger.error({
      message: "Cache operation failed, falling back to direct fetch:",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: {
        key,
      },
    });

    return await fetchFn();
  }
}

export async function invalidateCache(key: string) {
  await safeRedisOperation(() => redis.del(key));
  Logger.info({
    message: `Invalidated cache for key: ${key}`,
    metadata: {
      key,
    },
  });
}

// Add some utility functions for common cache operations
export async function cacheGet<T>(key: string): Promise<T> {
  Logger.info({
    message: `Getting cache for key: ${key}`,
    metadata: {
      key,
    },
  });
  const value = await safeRedisOperation(() => redis.get(key));
  if (!value) return null as T;

  try {
    // Attempt to parse as JSON
    return JSON.parse(value as string) as T;
  } catch {
    // If parsing fails, return as-is
    return value as T;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_CACHE_TTL
) {
  Logger.info({
    message: `Setting cache for key: ${key}`,
    metadata: {
      key,
    },
  });
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);

  return safeRedisOperation(() =>
    redis.set(key, stringValue, { ex: ttlSeconds })
  );
}

export async function cacheDelete(key: string) {
  Logger.info({
    message: `Deleting cache for key: ${key}`,
    metadata: {
      key,
    },
  });
  return safeRedisOperation(() => redis.del(key));
}

export async function getCachedDataWithRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<T> {
  const cached = await cacheGet<T>(key);

  // If we have cached data, return it immediately
  if (cached) {
    Logger.info({
      message: `Returning cached data for key: ${key}`,
      metadata: {
        key,
      },
    });
    return cached;
  }

  // Only fetch fresh data if cache is empty
  Logger.info({
    message: `No cache found, fetching fresh data for key: ${key}`,
    metadata: {
      key,
    },
  });
  const freshData = await fetchFn();
  await cacheSet(key, freshData, ttlSeconds);
  return freshData;
}
