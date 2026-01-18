/**
 * =============================================================================
 * UNIFIED VIDEO GENERATION QUEUE
 * =============================================================================
 *
 * This module provides a unified interface for queueing video generation jobs.
 * It automatically selects between QStash (cost-effective) and Kafka (scalable)
 * based on the QUEUE_BACKEND environment variable.
 *
 * BACKENDS:
 * - qstash (default): Pay-per-message, serverless, ~$0 for low traffic
 * - kafka: High-throughput, requires AWS MSK (~$220/month)
 *
 * USAGE:
 *   import { queueVideoGeneration, getVideoQueueHealth } from "~/services/videoQueue.server";
 *   const result = await queueVideoGeneration(formData, userId);
 *
 * =============================================================================
 */

import type { CreateVideoFormData } from "~/routes/create-video";
import { queueVideoGenerationQStash, checkQStashHealth } from "./qstash.server";
import { getVideoGenerationProducer } from "./videoGenerationProducer.server";

export type QueueBackend = "qstash" | "kafka";

export interface QueueResult {
  requestId: string;
  processingUrl: string;
}

/**
 * Get the configured queue backend
 */
export function getQueueBackend(): QueueBackend {
  const backend = process.env.QUEUE_BACKEND?.toLowerCase();

  if (backend === "kafka") {
    return "kafka";
  }

  // Default to qstash for cost savings
  return "qstash";
}

/**
 * Check if async queue processing is enabled for videos
 */
export function isVideoQueueEnabled(): boolean {
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === "production";

  // In production, queue is enabled by default if QSTASH_TOKEN is set
  if (isProduction) {
    const backend = getQueueBackend();
    if (backend === "qstash") {
      return !!process.env.QSTASH_TOKEN;
    }
    if (backend === "kafka") {
      return process.env.ENABLE_KAFKA_VIDEO_GENERATION === "true";
    }
  }

  // In development, check the explicit flag or QSTASH_TOKEN
  return (
    process.env.ENABLE_ASYNC_QUEUE === "true" ||
    !!process.env.QSTASH_TOKEN ||
    process.env.ENABLE_KAFKA_VIDEO_GENERATION === "true"
  );
}

/**
 * Queue a video generation request
 * Automatically selects the appropriate backend
 */
export async function queueVideoGeneration(
  formData: CreateVideoFormData,
  userId: string
): Promise<QueueResult> {
  const backend = getQueueBackend();

  console.log(`[Video Queue] Using ${backend} backend for video generation`);

  if (backend === "kafka") {
    const producer = await getVideoGenerationProducer();
    return producer.queueVideoGeneration(formData, userId);
  }

  // Default: QStash
  return queueVideoGenerationQStash(formData, userId);
}

/**
 * Check health of the configured queue backend for videos
 */
export async function getVideoQueueHealth(): Promise<{
  healthy: boolean;
  backend: QueueBackend;
  message: string;
}> {
  const backend = getQueueBackend();

  if (backend === "kafka") {
    try {
      const producer = await getVideoGenerationProducer();
      const isHealthy = await producer.healthCheck();
      return {
        healthy: isHealthy,
        backend: "kafka",
        message: isHealthy
          ? "Kafka is healthy"
          : "Kafka connection failed",
      };
    } catch (error) {
      return {
        healthy: false,
        backend: "kafka",
        message: `Kafka error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // Default: Check QStash health
  try {
    const isHealthy = await checkQStashHealth();
    return {
      healthy: isHealthy,
      backend: "qstash",
      message: isHealthy
        ? "QStash is healthy"
        : "QStash connection failed",
    };
  } catch (error) {
    return {
      healthy: false,
      backend: "qstash",
      message: `QStash error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
