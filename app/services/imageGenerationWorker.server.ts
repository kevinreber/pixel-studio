/**
 * =============================================================================
 * KAFKA IMAGE GENERATION WORKER - READY FOR SCALE
 * =============================================================================
 *
 * This worker consumes image generation requests from Kafka and processes them
 * asynchronously. It includes:
 * - Atomic job claiming (prevents duplicate processing)
 * - Progress tracking via Redis pub/sub
 * - Automatic retries and error handling
 * - Worker pooling for horizontal scaling
 *
 * CURRENT STATUS: Available but not used (using QStash for cost savings)
 *
 * TO USE WITH KAFKA:
 * 1. Set QUEUE_BACKEND=kafka in .env
 * 2. Start workers: npm run kafka:consumer
 *
 * See infrastructure/kafka/README.md for full setup instructions.
 * =============================================================================
 */

import { createConsumer, createProducer, IMAGE_TOPICS } from "./kafka.server";
import { createNewImages } from "~/server/createNewImages";
import {
  publishProcessingUpdate,
  getProcessingStatusService,
} from "./processingStatus.server";
import type { ImageGenerationRequest } from "./imageGenerationProducer.server";

export interface ProcessingStatusUpdate {
  requestId: string;
  userId: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number; // 0-100
  message?: string;
  setId?: string;
  images?: unknown[];
  error?: string;
  timestamp: Date;
}

export class ImageGenerationWorker {
  private consumer: ReturnType<typeof createConsumer>;
  private producer: ReturnType<typeof createProducer>;
  private isRunning: boolean = false;
  private readonly groupId: string;
  private readonly workerId: string;

  constructor(workerId: string = "default") {
    this.workerId = workerId;
    this.groupId = "image-generators";
    this.consumer = createConsumer(this.groupId);
    this.producer = createProducer();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`Worker ${this.workerId} is already running`);
      return;
    }

    console.log(`🚀 Starting Image Generation Worker: ${this.workerId}`);

    try {
      // Connect consumer and producer
      await this.consumer.connect();
      await this.producer.connect();

      // Subscribe to image generation requests
      await this.consumer.subscribe({
        topic: IMAGE_TOPICS.GENERATION_REQUESTS,
        fromBeginning: false, // Only process new messages
      });

      this.isRunning = true;

      // Start consuming messages with auto-commit and atomic deduplication
      await this.consumer.run({
        autoCommit: true, // Let Kafka handle commits automatically
        eachMessage: async ({ message }) => {
          const startTime = Date.now();

          try {
            if (!message.value) {
              console.warn("Received empty message, skipping...");
              return;
            }

            const request: ImageGenerationRequest = JSON.parse(
              message.value.toString()
            );
            console.log(
              `[Worker ${this.workerId}] Processing request: ${request.requestId}`
            );

            // Atomic deduplication: Try to claim the request for processing
            const statusService = getProcessingStatusService();

            // First, try to set status to "processing" atomically (Redis SET NX)
            const claimResult = await statusService.claimProcessingRequest(
              request.requestId,
              request.userId,
              this.workerId
            );

            if (!claimResult.claimed) {
              console.log(
                `[Worker ${this.workerId}] Request ${request.requestId} already being processed by ${claimResult.currentProcessor}, skipping...`
              );
              return; // Another worker is already handling this
            }

            console.log(
              `[Worker ${this.workerId}] Successfully claimed request ${request.requestId} for processing`
            );

            // Validate request
            if (!this.isValidRequest(request)) {
              console.error(`Invalid request format:`, request);
              await this.publishError(request, "Invalid request format");
              return;
            }

            await this.processImageGeneration(request);

            const duration = Date.now() - startTime;
            console.log(
              `[Worker ${this.workerId}] Completed request ${request.requestId} in ${duration}ms`
            );
          } catch (error) {
            console.error(
              `[Worker ${this.workerId}] Error processing message:`,
              error
            );

            // Try to extract request for error reporting
            try {
              const request = JSON.parse(message.value?.toString() || "{}");
              await this.publishError(
                request,
                error instanceof Error ? error.message : "Unknown error"
              );
            } catch (parseError) {
              console.error(
                "Could not parse failed message for error reporting:",
                parseError
              );
            }
          }
        },
      });
    } catch (error) {
      console.error(`Failed to start worker ${this.workerId}:`, error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`⏹️  Stopping Image Generation Worker: ${this.workerId}`);

    this.isRunning = false;

    try {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      console.log(`✅ Worker ${this.workerId} stopped successfully`);
    } catch (error) {
      console.error(`Error stopping worker ${this.workerId}:`, error);
    }
  }

  private async processImageGeneration(
    request: ImageGenerationRequest
  ): Promise<void> {
    const { requestId, userId } = request;

    try {
      // Update status to processing
      await publishProcessingUpdate(requestId, {
        userId,
        status: "processing",
        progress: 10,
        message: `Starting generation of ${request.numberOfImages} images using ${request.model}...`,
        timestamp: new Date(),
      });

      // Prepare form data for existing createNewImages function
      const formData = {
        prompt: request.prompt,
        numberOfImages: request.numberOfImages,
        model: request.model,
        stylePreset: request.stylePreset,
        private: request.private || false,
      };

      // Use existing image generation logic
      console.log(
        `[Worker ${this.workerId}] Generating images for request: ${requestId}`
      );

      // Update progress during generation
      await publishProcessingUpdate(requestId, {
        userId,
        status: "processing",
        progress: 30,
        message: "Calling AI model...",
        timestamp: new Date(),
      });

      // This is the heavy lifting - the original blocking call
      const result = await createNewImages(formData, userId);

      // Check for errors from AI providers
      if ("error" in result) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Unknown error from AI provider";
        throw new Error(errorMessage);
      }

      // Validate result
      if (!result.setId || !result.images?.length) {
        throw new Error(
          "Failed to create images - incomplete response from AI provider"
        );
      }

      // Update progress to completion
      await publishProcessingUpdate(requestId, {
        userId,
        status: "processing",
        progress: 90,
        message: "Finalizing images...",
        timestamp: new Date(),
      });

      // Publish success
      await this.publishSuccess(request, result);
    } catch (error) {
      console.error(
        `[Worker ${this.workerId}] Error generating images for request ${requestId}:`,
        error
      );
      await this.publishError(
        request,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async publishSuccess(
    request: ImageGenerationRequest,
    result: { setId: string; images?: unknown[] }
  ): Promise<void> {
    const successMessage = {
      requestId: request.requestId,
      userId: request.userId,
      status: "complete" as const,
      progress: 100,
      message: `Successfully generated ${result.images?.length || 0} images`,
      setId: result.setId,
      images: result.images || [],
      timestamp: new Date(),
    };

    try {
      // Publish completion event
      await this.producer.send({
        topic: IMAGE_TOPICS.GENERATION_COMPLETE,
        messages: [
          {
            key: request.userId,
            value: JSON.stringify(successMessage),
            headers: {
              "request-id": request.requestId,
              "user-id": request.userId,
              "set-id": result.setId,
            },
          },
        ],
      });

      // Also publish final status update to Redis/WebSocket
      await publishProcessingUpdate(request.requestId, {
        userId: request.userId,
        status: "complete",
        progress: 100,
        message: `Successfully generated ${result.images?.length || 0} images`,
        setId: result.setId,
        images: result.images || [],
        timestamp: new Date(),
      });

      console.log(
        `[Worker ${this.workerId}] Published success for request: ${request.requestId}, setId: ${result.setId}`
      );
    } catch (error) {
      console.error("Failed to publish success message:", error);
    }
  }

  private async publishError(
    request: Partial<ImageGenerationRequest>,
    errorMessage: string
  ): Promise<void> {
    // Convert technical errors to user-friendly messages
    const getUserFriendlyMessage = (error: string): string => {
      if (
        error.includes("content_policy_violation") ||
        error.includes("safety system") ||
        error.includes("not allowed by our safety system")
      ) {
        return "Your prompt was rejected by the AI safety system. Please try rephrasing your request with less specific details about violence, weapons, or controversial content.";
      }

      if (
        error.includes("billing_hard_limit_reached") ||
        error.includes("quota exceeded")
      ) {
        return "AI service quota exceeded. Please try again later or contact support.";
      }

      if (error.includes("rate_limit_exceeded")) {
        return "Too many requests. Please wait a moment and try again.";
      }

      if (
        error.includes("model_not_found") ||
        error.includes("model not available")
      ) {
        return "The requested AI model is not available. Please try a different model.";
      }

      if (error.includes("timeout") || error.includes("Connection timeout")) {
        return "Request timed out. Please try again.";
      }

      // Default fallback for unknown errors
      return "Failed to create images - incomplete response from AI provider";
    };

    const userFriendlyMessage = getUserFriendlyMessage(errorMessage);

    const errorUpdate = {
      requestId: request.requestId || "unknown",
      userId: request.userId || "unknown",
      status: "failed" as const,
      progress: 0,
      error: errorMessage, // Keep technical error for logging
      message: userFriendlyMessage, // User-friendly message for display
      timestamp: new Date(),
    };

    try {
      // Publish failure event
      if (request.requestId && request.userId) {
        await this.producer.send({
          topic: IMAGE_TOPICS.GENERATION_FAILED,
          messages: [
            {
              key: request.userId,
              value: JSON.stringify(errorUpdate),
              headers: {
                "request-id": request.requestId,
                "user-id": request.userId,
                error: errorMessage,
              },
            },
          ],
        });
      }

      // Also publish final status update to Redis/WebSocket
      if (request.requestId && request.userId) {
        await publishProcessingUpdate(request.requestId, {
          userId: request.userId,
          status: "failed",
          progress: 0,
          error: errorMessage,
          message: `Image generation failed: ${errorMessage}`,
          timestamp: new Date(),
        });
      }

      console.log(
        `[Worker ${this.workerId}] Published error for request: ${request.requestId}`
      );
    } catch (error) {
      console.error("Failed to publish error message:", error);
    }
  }

  private isValidRequest(request: unknown): request is ImageGenerationRequest {
    if (!request || typeof request !== "object" || request === null) {
      return false;
    }

    const req = request as Record<string, unknown>;

    return (
      "requestId" in req &&
      "userId" in req &&
      "prompt" in req &&
      "numberOfImages" in req &&
      "model" in req &&
      typeof req.requestId === "string" &&
      typeof req.userId === "string" &&
      typeof req.prompt === "string" &&
      typeof req.numberOfImages === "number" &&
      typeof req.model === "string" &&
      req.numberOfImages > 0 &&
      req.numberOfImages <= 10 &&
      req.prompt.length > 0
    );
  }

  // Health check method
  isHealthy(): boolean {
    return this.isRunning;
  }

  getWorkerId(): string {
    return this.workerId;
  }
}

// Worker pool management
export class ImageGenerationWorkerPool {
  private workers: Map<string, ImageGenerationWorker> = new Map();
  private readonly maxWorkers: number;

  constructor(maxWorkers: number = 3) {
    this.maxWorkers = Math.max(1, maxWorkers);
  }

  async startWorkers(): Promise<void> {
    console.log(`🚀 Starting ${this.maxWorkers} image generation workers...`);

    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < this.maxWorkers; i++) {
      const workerId = `worker-${i + 1}`;
      const worker = new ImageGenerationWorker(workerId);
      this.workers.set(workerId, worker);
      workerPromises.push(worker.start());
    }

    try {
      await Promise.all(workerPromises);
      console.log(`✅ All ${this.maxWorkers} workers started successfully`);
    } catch (error) {
      console.error("Failed to start worker pool:", error);
      await this.stopWorkers(); // Cleanup on failure
      throw error;
    }
  }

  async stopWorkers(): Promise<void> {
    console.log("⏹️  Stopping all workers...");

    const stopPromises = Array.from(this.workers.values()).map((worker) =>
      worker.stop()
    );

    try {
      await Promise.all(stopPromises);
      this.workers.clear();
      console.log("✅ All workers stopped successfully");
    } catch (error) {
      console.error("Error stopping workers:", error);
    }
  }

  getWorkerStatus(): Array<{ workerId: string; isHealthy: boolean }> {
    return Array.from(this.workers.entries()).map(([workerId, worker]) => ({
      workerId,
      isHealthy: worker.isHealthy(),
    }));
  }

  getWorkerCount(): number {
    return this.workers.size;
  }
}
