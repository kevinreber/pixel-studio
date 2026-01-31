import { Redis } from "@upstash/redis";

const isTestEnvironment = process.env.CI === "true" || process.env.NODE_ENV === "test";
const hasRedisCredentials = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Only throw in production if credentials are missing
if (
  process.env.NODE_ENV === "production" &&
  !hasRedisCredentials
) {
  throw new Error("Redis credentials not found in environment variables");
}

// Create a mock Redis client for test environments or when credentials are missing
const createMockRedis = () => ({
  get: async () => null,
  set: async () => "OK",
  del: async () => 1,
  ping: async () => "PONG",
  keys: async () => [],
});

// Use mock Redis in test environments or when credentials are missing (dev mode)
export const redis = (isTestEnvironment || !hasRedisCredentials)
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
