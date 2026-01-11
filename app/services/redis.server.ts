import { Redis } from "@upstash/redis";

const isTestEnvironment = process.env.CI === "true" || process.env.NODE_ENV === "test";

if (
  !isTestEnvironment &&
  (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
) {
  throw new Error("Redis credentials not found in environment variables");
}

// Create a mock Redis client for test environments
const createMockRedis = () => ({
  get: async () => null,
  set: async () => "OK",
  del: async () => 1,
  ping: async () => "PONG",
  keys: async () => [],
});

export const redis = isTestEnvironment
  ? (createMockRedis() as unknown as Redis)
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

export class RedisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisError";
  }
}

export async function safeRedisOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Redis operation failed:", error);
    throw new RedisError(
      error instanceof Error ? error.message : "Unknown Redis error"
    );
  }
}
