/**
 * Video Generation Worker
 *
 * Consumes video generation requests from Kafka and processes them
 * using the appropriate AI provider.
 */

import { createConsumer, createProducer, VIDEO_TOPICS } from "./kafka.server";
import { createNewVideos, type CreateVideosFormData } from "~/server/createNewVideos";
import {
  getProcessingStatusService,
  type ProcessingStatusData,
} from "./processingStatus.server";
import type { Consumer, Producer, EachMessagePayload } from "kafkajs";

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

export class VideoGenerationWorker {
  private consumer: Consumer;
  private producer: Producer;
  private workerId: string;
  private isRunning: boolean = false;

  constructor(workerId: string) {
    this.workerId = workerId;
    this.consumer = createConsumer(`video-generators-${workerId}`);
    this.producer = createProducer();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Worker ${this.workerId} is already running`);
      return;
    }

    try {
      await this.consumer.connect();
      await this.producer.connect();

      await this.consumer.subscribe({
        topic: VIDEO_TOPICS.GENERATION_REQUESTS,
        fromBeginning: false,
      });

      this.isRunning = true;

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      });

      console.log(`Video generation worker ${this.workerId} started`);
    } catch (error) {
      console.error(`Failed to start worker ${this.workerId}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      console.log(`Video generation worker ${this.workerId} stopped`);
    } catch (error) {
      console.error(`Error stopping worker ${this.workerId}:`, error);
    }
  }

  private async processMessage({ message }: EachMessagePayload): Promise<void> {
    if (!message.value) {
      console.warn("Received empty message");
      return;
    }

    let request: VideoGenerationRequest;

    try {
      request = JSON.parse(message.value.toString());
    } catch (error) {
      console.error("Failed to parse message:", error);
      return;
    }

    const { requestId, userId } = request;

    console.log(
      `Worker ${this.workerId} processing video request ${requestId}`
    );

    // Try to claim this request (atomic operation to prevent duplicate processing)
    const statusService = getProcessingStatusService();
    const claimResult = await statusService.claimProcessingRequest(
      requestId,
      userId,
      this.workerId
    );

    if (!claimResult.claimed) {
      console.log(
        `Request ${requestId} already claimed by another worker, skipping`
      );
      return;
    }

    // Update status to processing
    await this.updateStatus(requestId, userId, {
      status: "processing",
      progress: 0,
      message: "Starting video generation...",
    });

    try {
      // Validate request
      if (!request.prompt || !request.model) {
        throw new Error("Invalid request: missing prompt or model");
      }

      // Create form data for video generation
      const formData: CreateVideosFormData = {
        prompt: request.prompt,
        model: request.model,
        duration: request.duration,
        aspectRatio: request.aspectRatio,
        sourceImageUrl: request.sourceImageUrl,
        sourceImageId: request.sourceImageId,
        private: request.private,
      };

      // Progress callback
      const onProgress = async (progress: number, status: string) => {
        await this.updateStatus(requestId, userId, {
          status: "processing",
          progress,
          message: `Video generation: ${status} (${progress}%)`,
        });
      };

      // Generate video
      const result = await createNewVideos(formData, userId, onProgress);

      // Check for errors
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      // Success!
      await this.updateStatus(requestId, userId, {
        status: "complete",
        progress: 100,
        message: "Video generated successfully!",
        setId: result.setId,
      });

      // Publish completion event
      await this.publishCompletion(requestId, userId, result.setId);

      console.log(
        `Worker ${this.workerId} completed video request ${requestId}`
      );
    } catch (error) {
      console.error(
        `Worker ${this.workerId} failed on request ${requestId}:`,
        error
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      await this.updateStatus(requestId, userId, {
        status: "failed",
        progress: 0,
        message: errorMessage,
        error: errorMessage,
      });

      // Publish failure event
      await this.publishFailure(requestId, userId, errorMessage);
    }
  }

  private async updateStatus(
    requestId: string,
    userId: string,
    update: Omit<Partial<ProcessingStatusData>, "requestId" | "createdAt" | "updatedAt">
  ): Promise<void> {
    try {
      const statusService = getProcessingStatusService();
      await statusService.updateProcessingStatus(requestId, {
        userId,
        status: update.status || "processing",
        progress: update.progress || 0,
        message: update.message,
        setId: update.setId,
        error: update.error,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`Failed to update status for ${requestId}:`, error);
    }
  }

  private async publishCompletion(
    requestId: string,
    userId: string,
    setId: string
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: VIDEO_TOPICS.GENERATION_COMPLETE,
        messages: [
          {
            key: requestId,
            value: JSON.stringify({
              requestId,
              userId,
              setId,
              completedAt: new Date().toISOString(),
              processor: this.workerId,
            }),
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to publish completion for ${requestId}:`, error);
    }
  }

  private async publishFailure(
    requestId: string,
    userId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await this.producer.send({
        topic: VIDEO_TOPICS.GENERATION_FAILED,
        messages: [
          {
            key: requestId,
            value: JSON.stringify({
              requestId,
              userId,
              error: errorMessage,
              failedAt: new Date().toISOString(),
              processor: this.workerId,
            }),
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to publish failure for ${requestId}:`, error);
    }
  }
}

/**
 * Video Generation Worker Pool
 *
 * Manages multiple worker instances for parallel processing
 */
export class VideoGenerationWorkerPool {
  private workers: VideoGenerationWorker[] = [];
  private poolSize: number;

  constructor(poolSize: number = 2) {
    this.poolSize = poolSize;
  }

  async start(): Promise<void> {
    console.log(`Starting video generation worker pool with ${this.poolSize} workers`);

    for (let i = 0; i < this.poolSize; i++) {
      const workerId = `video-worker-${i + 1}`;
      const worker = new VideoGenerationWorker(workerId);
      this.workers.push(worker);
      await worker.start();
    }
  }

  async stop(): Promise<void> {
    console.log("Stopping video generation worker pool");

    await Promise.all(this.workers.map((worker) => worker.stop()));
    this.workers = [];
  }
}

// Default pool instance
let workerPool: VideoGenerationWorkerPool | null = null;

export async function startVideoGenerationWorkers(
  poolSize: number = 2
): Promise<VideoGenerationWorkerPool> {
  if (!workerPool) {
    workerPool = new VideoGenerationWorkerPool(poolSize);
    await workerPool.start();
  }
  return workerPool;
}

export async function stopVideoGenerationWorkers(): Promise<void> {
  if (workerPool) {
    await workerPool.stop();
    workerPool = null;
  }
}
