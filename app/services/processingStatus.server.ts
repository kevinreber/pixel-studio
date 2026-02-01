import { redis, safeRedisOperation } from "./redis.server";
import type { ProcessingStatusUpdate } from "./imageGenerationWorker.server";

// Constants
const PROCESSING_KEY_PREFIX = "processing:";
const DEFAULT_TTL = 3600; // 1 hour in seconds

// Extended status update interface for storage
export interface ProcessingStatusData extends ProcessingStatusUpdate {
  createdAt: string;
  updatedAt: string;
  processor?: string; // Worker ID that claimed/is processing this request
}

/**
 * Service for managing processing status updates with Redis storage and real-time broadcasting
 */
export class ProcessingStatusService {
  /**
   * Atomically claim a processing request to prevent duplicates
   */
  async claimProcessingRequest(
    requestId: string,
    userId: string,
    workerId: string
  ): Promise<{ claimed: boolean; currentProcessor?: string }> {
    const key = this.getRedisKey(requestId);
    const now = new Date().toISOString();
    const claimData: ProcessingStatusData = {
      requestId,
      userId,
      status: "processing",
      progress: 0,
      message: `Processing started by ${workerId}`,
      timestamp: new Date(),
      createdAt: now,
      updatedAt: now,
      processor: workerId,
    };

    try {
      // First check if request exists and is in "queued" status (can be claimed)
      const existingData = await this.getProcessingStatus(requestId);

      if (existingData) {
        // If already processing/complete/failed by another worker, don't claim
        if (existingData.status !== "queued") {
          console.log(
            `❌ Request ${requestId} already in status "${existingData.status}" by ${
              existingData.processor || "unknown"
            }`
          );
          return {
            claimed: false,
            currentProcessor: existingData.processor || "unknown",
          };
        }

        // Request is in "queued" status - claim it by updating
        claimData.createdAt = existingData.createdAt; // Preserve original creation time
        await safeRedisOperation(async () => {
          return await redis.set(key, JSON.stringify(claimData), {
            ex: DEFAULT_TTL,
          });
        });

        console.log(
          `✅ Successfully claimed queued request ${requestId} for worker ${workerId}`
        );
        await this.broadcastUpdate(claimData);
        return { claimed: true };
      }

      // Request doesn't exist yet - use SET NX for atomic claim
      const result = await safeRedisOperation(async () => {
        return await redis.set(key, JSON.stringify(claimData), {
          ex: DEFAULT_TTL,
          nx: true,
        });
      });

      if (result) {
        // Successfully claimed the request
        console.log(
          `✅ Successfully claimed new request ${requestId} for worker ${workerId}`
        );
        await this.broadcastUpdate(claimData);
        return { claimed: true };
      } else {
        // Race condition - someone else claimed it between our check and set
        const newExistingData = await this.getProcessingStatus(requestId);
        console.log(
          `❌ Request ${requestId} claimed by another worker: ${
            newExistingData?.processor || "unknown"
          }`
        );
        return {
          claimed: false,
          currentProcessor: newExistingData?.processor || "unknown",
        };
      }
    } catch (error) {
      console.error(`Error claiming request ${requestId}:`, error);
      // If Redis is down, allow processing to continue (fail-safe)
      return { claimed: true };
    }
  }

  /**
   * Store or update processing status for a request
   */
  async updateProcessingStatus(
    requestId: string,
    update: Omit<ProcessingStatusUpdate, "requestId">
  ): Promise<void> {
    const key = this.getRedisKey(requestId);
    const now = new Date().toISOString();

    // Get existing data to preserve createdAt (safely handle corrupted data)
    let existing: ProcessingStatusData | null = null;
    try {
      existing = await this.getProcessingStatus(requestId);
    } catch (error) {
      console.warn(
        `Could not retrieve existing status for ${requestId}, starting fresh:`,
        error
      );
      // Continue with existing = null, will create fresh data
    }

    const statusData: ProcessingStatusData = {
      requestId,
      ...update,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      // Store in Redis with TTL using Upstash Redis
      await safeRedisOperation(() =>
        redis.set(key, JSON.stringify(statusData), { ex: DEFAULT_TTL })
      );

      console.log(
        `Updated processing status for ${requestId}: ${update.status} (${update.progress}%)`
      );

      // Broadcast update to WebSocket clients
      await this.broadcastUpdate(statusData);
    } catch (error) {
      console.error(
        `Failed to update processing status for ${requestId}:`,
        error
      );
      throw new Error("Failed to update processing status");
    }
  }

  /**
   * Retrieve current processing status for a request
   */
  async getProcessingStatus(
    requestId: string
  ): Promise<ProcessingStatusData | null> {
    const key = this.getRedisKey(requestId);

    try {
      const data = await safeRedisOperation(() => redis.get(key));
      if (!data) return null;

      // Handle both string and object responses from Upstash Redis
      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch (parseError) {
          console.error(`Failed to parse JSON for ${requestId}:`, parseError);
          console.log(`Raw data was:`, data);
          // Delete corrupted data and return null
          await safeRedisOperation(() => redis.del(key));
          return null;
        }
      } else if (typeof data === "object" && data !== null) {
        // Validate that it has the expected structure
        if ("requestId" in data && "status" in data) {
          return data as ProcessingStatusData;
        } else {
          console.error(`Invalid object structure for ${requestId}:`, data);
          // Delete corrupted data and return null
          await safeRedisOperation(() => redis.del(key));
          return null;
        }
      }

      console.warn(`Unexpected data type for ${requestId}:`, typeof data, data);
      return null;
    } catch (error) {
      console.error(`Failed to get processing status for ${requestId}:`, error);
      return null;
    }
  }

  /**
   * Delete processing status (cleanup after completion/failure)
   */
  async deleteProcessingStatus(requestId: string): Promise<void> {
    const key = this.getRedisKey(requestId);

    try {
      await safeRedisOperation(() => redis.del(key));
      console.log(`Cleaned up processing status for ${requestId}`);
    } catch (error) {
      console.error(
        `Failed to delete processing status for ${requestId}:`,
        error
      );
    }
  }

  /**
   * Get all active processing requests (for monitoring)
   * Uses SCAN instead of KEYS to avoid blocking Redis with O(N) operations
   */
  async getActiveProcessingRequests(): Promise<ProcessingStatusData[]> {
    try {
      // Use SCAN for non-blocking iteration instead of KEYS
      const allKeys: string[] = [];
      let cursor = "0";
      const scanPattern = `${PROCESSING_KEY_PREFIX}*`;
      const scanCount = 100; // Process 100 keys per iteration
      let isFirstIteration = true;

      do {
        const result = await safeRedisOperation(() =>
          redis.scan(isFirstIteration ? 0 : cursor, {
            match: scanPattern,
            count: scanCount,
          })
        );
        isFirstIteration = false;

        // Upstash Redis returns [string, string[]] where cursor is a string
        cursor = result[0];
        const keys = result[1];
        if (keys && keys.length > 0) {
          allKeys.push(...keys);
        }
        // Continue until cursor is "0"
      } while (cursor !== "0");

      if (allKeys.length === 0) {
        return [];
      }

      // Get all values for these keys
      const values = (await safeRedisOperation(() =>
        redis.mget(...allKeys)
      )) as (string | object | null)[];
      return values
        .filter((value): value is string | object => value !== null)
        .map((value) => {
          // Handle both string and object responses from Upstash Redis
          if (typeof value === "string") {
            try {
              return JSON.parse(value);
            } catch (parseError) {
              console.warn(
                "Failed to parse processing status JSON:",
                parseError
              );
              return null;
            }
          } else if (typeof value === "object" && value !== null) {
            return value;
          }
          return null;
        })
        .filter((status): status is ProcessingStatusData => status !== null);
    } catch (error) {
      console.error("Failed to get active processing requests:", error);
      return [];
    }
  }

  /**
   * Cleanup expired or completed requests older than specified time
   */
  async cleanupOldRequests(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      const allRequests = await this.getActiveProcessingRequests();

      let deletedCount = 0;

      for (const request of allRequests) {
        const updatedAt = new Date(request.updatedAt);

        // Delete if old or completed/failed
        if (
          updatedAt < cutoffTime ||
          request.status === "complete" ||
          request.status === "failed"
        ) {
          await this.deleteProcessingStatus(request.requestId);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old processing requests`);
      return deletedCount;
    } catch (error) {
      console.error("Failed to cleanup old requests:", error);
      return 0;
    }
  }

  /**
   * Broadcast status update to WebSocket clients
   *
   * Note: Upstash REST Redis doesn't support pub/sub.
   * The WebSocket server uses polling to check for status updates instead.
   * This method is kept for compatibility but the actual broadcast is handled
   * by the WebSocket server's polling mechanism.
   */
  private async broadcastUpdate(
    statusData: ProcessingStatusData
  ): Promise<void> {
    // Upstash REST Redis doesn't support pub/sub (publish/subscribe).
    // The WebSocket server polls Redis for status updates instead.
    // No action needed here - status is already saved to Redis.
    // Just log for debugging purposes.
    console.log(`[Status broadcast] ${statusData.requestId}: ${statusData.status}`);
  }

  /**
   * Generate Redis key for a request ID
   */
  private getRedisKey(requestId: string): string {
    return `${PROCESSING_KEY_PREFIX}${requestId}`;
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await safeRedisOperation(() => redis.ping());
      return result === "PONG";
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  /**
   * Get Redis connection stats
   */
  async getConnectionStats(): Promise<{
    status: string;
    provider: string;
    url: string;
    operations: {
      successful: number;
      failed: number;
    };
  } | null> {
    try {
      return {
        status: "connected", // Upstash Redis is connectionless (REST API)
        provider: "upstash",
        url: process.env.UPSTASH_REDIS_REST_URL ? "configured" : "missing",
        operations: {
          successful: 0, // Upstash doesn't provide these stats via REST API
          failed: 0,
        },
      };
    } catch (error) {
      console.error("Failed to get connection stats:", error);
      return null;
    }
  }
}

// Singleton instance
let processingStatusService: ProcessingStatusService | null = null;

/**
 * Get singleton instance of ProcessingStatusService
 */
export function getProcessingStatusService(): ProcessingStatusService {
  if (!processingStatusService) {
    processingStatusService = new ProcessingStatusService();
  }
  return processingStatusService;
}

// Convenience functions for direct use
export async function publishProcessingUpdate(
  requestId: string,
  update: Omit<ProcessingStatusUpdate, "requestId">
): Promise<void> {
  const service = getProcessingStatusService();
  await service.updateProcessingStatus(requestId, update);
}

export async function getProcessingStatus(
  requestId: string
): Promise<ProcessingStatusData | null> {
  const service = getProcessingStatusService();
  return service.getProcessingStatus(requestId);
}

// Cleanup job - run periodically
export async function runStatusCleanup(): Promise<void> {
  const service = getProcessingStatusService();
  await service.cleanupOldRequests();
}
