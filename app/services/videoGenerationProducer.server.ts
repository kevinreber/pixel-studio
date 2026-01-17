import { createId } from "@paralleldrive/cuid2";
import { createProducer, createAdmin, VIDEO_TOPICS } from "./kafka.server";
import type { CreateVideosFormData } from "~/server/createNewVideos";

export interface VideoGenerationRequest {
  requestId: string;
  userId: string;
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
  timestamp: Date;
}

export interface VideoGenerationResponse {
  requestId: string;
  processingUrl: string;
}

export class VideoGenerationProducer {
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
   * Queue a video generation request for async processing
   * Returns immediately with a request ID for tracking
   */
  async queueVideoGeneration(
    formData: CreateVideosFormData,
    userId: string
  ): Promise<VideoGenerationResponse> {
    if (!this.isConnected) {
      await this.connect();
    }

    // Generate unique request ID
    const requestId = createId();

    // Create the request payload
    const request: VideoGenerationRequest = {
      requestId,
      userId,
      prompt: formData.prompt,
      model: formData.model,
      duration: formData.duration,
      aspectRatio: formData.aspectRatio,
      sourceImageUrl: formData.sourceImageUrl,
      sourceImageId: formData.sourceImageId,
      private: formData.private || false,
      timestamp: new Date(),
    };

    try {
      // Send to Kafka topic for processing
      await this.producer.send({
        topic: VIDEO_TOPICS.GENERATION_REQUESTS,
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
        `Queued video generation request: ${requestId} for user: ${userId}`
      );

      return {
        requestId,
        processingUrl: `/processing/${requestId}?type=video`,
      };
    } catch (error) {
      console.error("Failed to queue video generation:", error);
      throw new Error(
        `Failed to queue video generation: ${
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
let producerInstance: VideoGenerationProducer | null = null;

export async function getVideoGenerationProducer(): Promise<VideoGenerationProducer> {
  if (!producerInstance) {
    producerInstance = new VideoGenerationProducer();
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
