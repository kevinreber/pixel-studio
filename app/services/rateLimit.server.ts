import { Ratelimit } from "@upstash/ratelimit";
import { json } from "@remix-run/node";
import { redis } from "~/services/redis.server";
import { Logger } from "~/utils/logger.server";

const isTestEnvironment =
  process.env.CI === "true" || process.env.NODE_ENV === "test";
const hasRedisCredentials =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const rateLimitEnabled = !isTestEnvironment && !!hasRedisCredentials;

function createLimiter(
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string
): Ratelimit | null {
  if (!rateLimitEnabled) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ratelimit:${prefix}`,
    analytics: false,
  });
}

// Strict: auth endpoints (unauthenticated, most vulnerable)
export const authLimiter = createLimiter(10, "15 m", "auth");

// Strict: image/video generation (expensive external API calls)
export const generationLimiter = createLimiter(5, "1 m", "gen");

// Moderate: tipping, purchases, checkout
export const financialLimiter = createLimiter(10, "1 m", "fin");

// Moderate: comments, likes, follows, collections
export const writeLimiter = createLimiter(30, "1 m", "write");

// Light: read-heavy API endpoints
export const readLimiter = createLimiter(60, "1 m", "read");

// Admin: higher trust but still protected
export const adminLimiter = createLimiter(60, "1 m", "admin");

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}> {
  if (!limiter) return { success: true };

  try {
    const result = await limiter.limit(identifier);
    if (!result.success) {
      Logger.warn({
        message: "Rate limit exceeded",
        metadata: {
          identifier,
          limit: result.limit,
          remaining: result.remaining,
        },
      });
    }
    return result;
  } catch (error) {
    // Fail-open: if Redis is down, allow the request
    Logger.error({
      message: "Rate limit check failed, allowing request",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { identifier },
    });
    return { success: true };
  }
}

export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) return userId;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

export function rateLimitResponse(reset?: number) {
  const headers: Record<string, string> = {};
  if (reset) {
    headers["Retry-After"] = String(Math.ceil(reset / 1000));
  }
  return json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers }
  );
}
