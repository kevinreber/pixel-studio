/**
 * =============================================================================
 * KAFKA IMAGE GENERATION PRODUCER - READY FOR SCALE
 * =============================================================================
 *
 * This producer queues image generation requests to Kafka for async processing.
 * It's designed for high-throughput scenarios with AWS MSK.
 *
 * CURRENT STATUS: Available but not the default (using QStash for cost savings)
 *
 * For the unified queue interface, see: ./imageQueue.server.ts
 * That module automatically selects between QStash and Kafka based on config.
 *
 * TO USE KAFKA DIRECTLY:
 * 1. Set QUEUE_BACKEND=kafka in .env
 * 2. Use getImageGenerationProducer() from this module
 *
 * See infrastructure/kafka/README.md for full setup instructions.
 * =============================================================================
 */

import { createId } from "@paralleldrive/cuid2";
import { createProducer, createAdmin, IMAGE_TOPICS } from "./kafka.server";
import type { CreateImagesFormData } from "~/routes/create";

export interface ImageGenerationRequest {
  requestId: string;
  userId: string;
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
  timestamp: Date;
}

export interface ImageGenerationResponse {
  requestId: string;
  processingUrl: string;
}

export class ImageGenerationProducer {
  private producer: ReturnType<typeof createProducer>;
  private isConnected: boolean = false;

  constructor() {
    this.producer = createProducer();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Queue an image generation request for async processing
   * Returns immediately with a request ID for tracking
   */
  async queueImageGeneration(
    formData: CreateImagesFormData,
    userId: string
  ): Promise<ImageGenerationResponse> {
    if (!this.isConnected) {
      await this.connect();
    }

    // Generate unique request ID
    const requestId = createId();

    // Create the request payload
    const request: ImageGenerationRequest = {
      requestId,
      userId,
      prompt: formData.prompt,
      numberOfImages: formData.numberOfImages,
      model: formData.model,
      stylePreset: formData.stylePreset,
      private: formData.private || false,
      timestamp: new Date(),
    };

    try {
      // Send to Kafka topic for processing
      await this.producer.send({
        topic: IMAGE_TOPICS.GENERATION_REQUESTS,
        messages: [
          {
            key: userId, // Partition by user for ordered processing per user
            value: JSON.stringify(request),
            headers: {
              "request-id": requestId,
              "user-id": userId,
              model: formData.model,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      });

      console.log(
        `Queued image generation request: ${requestId} for user: ${userId}`
      );

      return {
        requestId,
        processingUrl: `/processing/${requestId}`,
      };
    } catch (error) {
      console.error("Failed to queue image generation:", error);
      throw new Error(
        `Failed to queue image generation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Health check - verify Kafka connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Try to get metadata - this will fail if Kafka is unreachable
      const admin = createAdmin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return true;
    } catch (error) {
      console.error("Kafka health check failed:", error);
      return false;
    }
  }
}

// Singleton instance for reuse across requests
let producerInstance: ImageGenerationProducer | null = null;

export async function getImageGenerationProducer(): Promise<ImageGenerationProducer> {
  if (!producerInstance) {
    producerInstance = new ImageGenerationProducer();
  }
  return producerInstance;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (producerInstance) {
    await producerInstance.disconnect();
  }
});

process.on("SIGINT", async () => {
  if (producerInstance) {
    await producerInstance.disconnect();
  }
});
