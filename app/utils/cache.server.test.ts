import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to define mocks that need to be available at hoist time
const { mockRedis, mockLogger } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Redis
vi.mock("~/services/redis.server", () => ({
  redis: mockRedis,
  safeRedisOperation: vi.fn((operation) => operation()),
  RedisError: class RedisError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "RedisError";
    }
  },
}));

// Mock Logger
vi.mock("~/utils/logger.server", () => ({
  Logger: mockLogger,
}));

import {
  getCachedData,
  getCachedDataWithRevalidate,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  invalidateCache,
} from "./cache.server";

describe("cache.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCachedData", () => {
    it("should return cached data when available", async () => {
      const cachedData = { id: 1, name: "test" };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = vi.fn();
      const result = await getCachedData("test-key", fetchFn);

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith("test-key");
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should fetch and cache data when cache is empty", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue("OK");

      const freshData = { id: 2, name: "fresh" };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await getCachedData("test-key", fetchFn, 3600);

      expect(result).toEqual(freshData);
      expect(mockRedis.get).toHaveBeenCalledWith("test-key");
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(freshData),
        { ex: 3600 }
      );
    });

    it("should use default TTL of 3600 seconds", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue("OK");

      const freshData = { id: 1 };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      await getCachedData("test-key", fetchFn);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(freshData),
        { ex: 3600 }
      );
    });

    it("should fallback to fetchFn when Redis fails", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis connection failed"));

      const freshData = { id: 3, name: "fallback" };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await getCachedData("test-key", fetchFn);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
    });
  });

  describe("getCachedDataWithRevalidate", () => {
    it("should return cached data when available", async () => {
      const cachedData = { id: 1, name: "cached" };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = vi.fn();
      const result = await getCachedDataWithRevalidate("test-key", fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it("should fetch fresh data when cache is empty", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue("OK");

      const freshData = { id: 2, name: "fresh" };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await getCachedDataWithRevalidate("test-key", fetchFn, 600);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify(freshData),
        { ex: 600 }
      );
    });
  });

  describe("cacheGet", () => {
    it("should return parsed JSON data", async () => {
      const data = { id: 1, items: ["a", "b"] };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGet("test-key");

      expect(result).toEqual(data);
    });

    it("should return null when key does not exist", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet("nonexistent-key");

      expect(result).toBeNull();
    });

    it("should return raw value when JSON parsing fails", async () => {
      mockRedis.get.mockResolvedValue("plain-string-value");

      const result = await cacheGet("test-key");

      expect(result).toBe("plain-string-value");
    });
  });

  describe("cacheSet", () => {
    it("should set value with default TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await cacheSet("test-key", { id: 1 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify({ id: 1 }),
        { ex: 3600 }
      );
    });

    it("should set value with custom TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await cacheSet("test-key", { id: 1 }, 300);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify({ id: 1 }),
        { ex: 300 }
      );
    });

    it("should handle string values without double-stringifying", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await cacheSet("test-key", "already-a-string");

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        "already-a-string",
        { ex: 3600 }
      );
    });
  });

  describe("cacheDelete", () => {
    it("should delete a single key", async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheDelete("test-key");

      expect(mockRedis.del).toHaveBeenCalledWith("test-key");
    });
  });

  describe("invalidateCache", () => {
    it("should be an alias for cacheDelete", async () => {
      mockRedis.del.mockResolvedValue(1);

      await invalidateCache("test-key");

      expect(mockRedis.del).toHaveBeenCalledWith("test-key");
    });
  });

  describe("cacheDeletePattern", () => {
    it("should delete all keys matching pattern", async () => {
      const matchingKeys = ["user-profile:123:1:50", "user-profile:123:2:50"];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(2);

      await cacheDeletePattern("user-profile:123:*");

      expect(mockRedis.keys).toHaveBeenCalledWith("user-profile:123:*");
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
    });

    it("should not call del when no keys match pattern", async () => {
      mockRedis.keys.mockResolvedValue([]);

      await cacheDeletePattern("nonexistent:*");

      expect(mockRedis.keys).toHaveBeenCalledWith("nonexistent:*");
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it("should handle null keys response", async () => {
      mockRedis.keys.mockResolvedValue(null);

      await cacheDeletePattern("test:*");

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});

describe("Cache Key Patterns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.del.mockResolvedValue(1);
    mockRedis.keys.mockResolvedValue([]);
  });

  describe("Collection cache keys", () => {
    it("should use correct key format for user collections", async () => {
      const userId = "user-abc-123";
      await cacheDelete(`user-collections:${userId}`);

      expect(mockRedis.del).toHaveBeenCalledWith("user-collections:user-abc-123");
    });
  });

  describe("Set cache keys", () => {
    it("should use pattern for set deletion to clear all filter combinations", async () => {
      const userId = "user-xyz";
      mockRedis.keys.mockResolvedValue([
        `sets:user:${userId}:undefined:undefined`,
        `sets:user:${userId}:prompt1:flux`,
        `sets:user:${userId}::dall-e`,
      ]);
      mockRedis.del.mockResolvedValue(3);

      await cacheDeletePattern(`sets:user:${userId}:*`);

      expect(mockRedis.keys).toHaveBeenCalledWith(`sets:user:${userId}:*`);
      expect(mockRedis.del).toHaveBeenCalledWith(
        `sets:user:${userId}:undefined:undefined`,
        `sets:user:${userId}:prompt1:flux`,
        `sets:user:${userId}::dall-e`
      );
    });
  });

  describe("Profile cache keys", () => {
    it("should use pattern for profile cache to clear all pagination", async () => {
      const userId = "user-123";
      mockRedis.keys.mockResolvedValue([
        `user-profile:${userId}:1:250`,
        `user-profile:${userId}:2:250`,
        `user-profile:${userId}:1:50`,
      ]);
      mockRedis.del.mockResolvedValue(3);

      await cacheDeletePattern(`user-profile:${userId}:*`);

      expect(mockRedis.keys).toHaveBeenCalledWith(`user-profile:${userId}:*`);
    });
  });

  describe("Feed cache keys", () => {
    it("should use pattern for feed cache to clear all pagination", async () => {
      const userId = "user-456";
      mockRedis.keys.mockResolvedValue([
        `following-feed:${userId}:1:20`,
        `following-feed:${userId}:2:20`,
      ]);
      mockRedis.del.mockResolvedValue(2);

      await cacheDeletePattern(`following-feed:${userId}:*`);

      expect(mockRedis.keys).toHaveBeenCalledWith(`following-feed:${userId}:*`);
    });
  });
});
