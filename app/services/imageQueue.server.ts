/**
 * =============================================================================
 * UNIFIED IMAGE GENERATION QUEUE
 * =============================================================================
 *
 * This module provides a unified interface for queueing image generation jobs.
 * It automatically selects between QStash (cost-effective) and Kafka (scalable)
 * based on the QUEUE_BACKEND environment variable.
 *
 * BACKENDS:
 * - qstash (default): Pay-per-message, serverless, ~$0 for low traffic
 * - kafka: High-throughput, requires AWS MSK (~$220/month)
 *
 * USAGE:
 *   import { queueImageGeneration, getQueueHealth } from "~/services/imageQueue.server";
 *   const result = await queueImageGeneration(formData, userId);
 *
 * =============================================================================
 */

import type { CreateImagesFormData } from "~/routes/create";
import { queueImageGenerationQStash, checkQStashHealth } from "./qstash.server";
import { getImageGenerationProducer } from "./imageGenerationProducer.server";

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
 * Check if async queue processing is enabled
 */
export function isQueueEnabled(): boolean {
  // Check if we're in production
  const isProduction = process.env.NODE_ENV === "production";

  // In production, queue is enabled by default if QSTASH_TOKEN is set
  if (isProduction) {
    const backend = getQueueBackend();
    if (backend === "qstash") {
      return !!process.env.QSTASH_TOKEN;
    }
    if (backend === "kafka") {
      return process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true";
    }
  }

  // In development, check the explicit flag or QSTASH_TOKEN
  return (
    process.env.ENABLE_ASYNC_QUEUE === "true" ||
    !!process.env.QSTASH_TOKEN ||
    process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true"
  );
}

/**
 * Queue an image generation request
 * Automatically selects the appropriate backend
 */
export async function queueImageGeneration(
  formData: CreateImagesFormData,
  userId: string
): Promise<QueueResult> {
  const backend = getQueueBackend();

  console.log(`[Queue] Using ${backend} backend for image generation`);

  if (backend === "kafka") {
    const producer = await getImageGenerationProducer();
    return producer.queueImageGeneration(formData, userId);
  }

  // Default: QStash
  return queueImageGenerationQStash(formData, userId);
}

/**
 * Check health of the configured queue backend
 */
export async function getQueueHealth(): Promise<{
  healthy: boolean;
  backend: QueueBackend;
  message: string;
}> {
  const backend = getQueueBackend();

  try {
    if (backend === "kafka") {
      const producer = await getImageGenerationProducer();
      const healthy = await producer.healthCheck();
      return {
        healthy,
        backend,
        message: healthy ? "Kafka is healthy" : "Kafka connection failed",
      };
    }

    // Default: QStash
    const healthy = await checkQStashHealth();
    return {
      healthy,
      backend,
      message: healthy ? "QStash is configured" : "QStash token not configured",
    };
  } catch (error) {
    return {
      healthy: false,
      backend,
      message: `Health check failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get queue configuration info (for debugging/monitoring)
 */
export function getQueueConfig(): {
  backend: QueueBackend;
  enabled: boolean;
  features: string[];
} {
  const backend = getQueueBackend();
  const enabled = isQueueEnabled();

  const features =
    backend === "kafka"
      ? [
          "High throughput",
          "Message ordering",
          "Partitioning",
          "Consumer groups",
          "AWS MSK ready",
        ]
      : [
          "Serverless",
          "Pay-per-message",
          "Auto retries",
          "HTTP callbacks",
          "Free tier (500/day)",
        ];

  return { backend, enabled, features };
}
