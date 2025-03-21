import { redis, safeRedisOperation } from "~/services/redis.server";

const DEFAULT_CACHE_TTL = 3600; // 1 hour

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_CACHE_TTL
): Promise<T> {
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
    console.error(
      "Cache operation failed, falling back to direct fetch:",
      error
    );
    return await fetchFn();
  }
}

export async function invalidateCache(key: string) {
  await safeRedisOperation(() => redis.del(key));
}

// Add some utility functions for common cache operations
export async function cacheGet<T>(key: string): Promise<T> {
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
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);

  return safeRedisOperation(() =>
    redis.set(key, stringValue, { ex: ttlSeconds })
  );
}

export async function cacheDelete(key: string) {
  return safeRedisOperation(() => redis.del(key));
}
