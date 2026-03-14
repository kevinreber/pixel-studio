import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis before importing
vi.mock("~/services/redis.server", () => ({
  redis: {},
}));

// Mock logger
vi.mock("~/utils/logger.server", () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock @upstash/ratelimit - in test env, limiters are null so we test helpers directly
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: {
    slidingWindow: vi.fn(),
  },
}));

import {
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "./rateLimit.server";
import { Logger } from "~/utils/logger.server";

describe("getRateLimitIdentifier", () => {
  it("returns userId when provided", () => {
    const request = new Request("https://example.com");
    expect(getRateLimitIdentifier(request, "user-123")).toBe("user-123");
  });

  it("returns IP from x-forwarded-for when no userId", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getRateLimitIdentifier(request)).toBe("ip:1.2.3.4");
  });

  it("returns ip:unknown when no userId and no forwarded header", () => {
    const request = new Request("https://example.com");
    expect(getRateLimitIdentifier(request)).toBe("ip:unknown");
  });

  it("trims whitespace from forwarded IP", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  10.0.0.1 , 10.0.0.2" },
    });
    expect(getRateLimitIdentifier(request)).toBe("ip:10.0.0.1");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when limiter is null (test/dev environment)", async () => {
    const result = await checkRateLimit(null, "user-123");
    expect(result).toEqual({ success: true });
  });

  it("returns limiter result when limit check succeeds", async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkRateLimit(mockLimiter as any, "user-123");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    expect(mockLimiter.limit).toHaveBeenCalledWith("user-123");
  });

  it("logs warning when rate limit is exceeded", async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkRateLimit(mockLimiter as any, "user-123");
    expect(result.success).toBe(false);
    expect(Logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Rate limit exceeded",
        metadata: expect.objectContaining({ identifier: "user-123" }),
      })
    );
  });

  it("fails open when Redis throws an error", async () => {
    const mockLimiter = {
      limit: vi.fn().mockRejectedValue(new Error("Redis connection failed")),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkRateLimit(mockLimiter as any, "user-123");
    expect(result.success).toBe(true);
    expect(Logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Rate limit check failed, allowing request",
      })
    );
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 status", async () => {
    const response = rateLimitResponse();
    expect(response.status).toBe(429);
  });

  it("includes error message in body", async () => {
    const response = rateLimitResponse();
    const body = await response.json();
    expect(body.error).toBe("Too many requests. Please try again later.");
  });

  it("includes Retry-After header when reset is provided", async () => {
    const response = rateLimitResponse(30000);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("omits Retry-After header when reset is not provided", async () => {
    const response = rateLimitResponse();
    expect(response.headers.get("Retry-After")).toBeNull();
  });
});
