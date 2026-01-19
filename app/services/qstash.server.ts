/**
 * =============================================================================
 * QSTASH QUEUE SERVICE - COST-EFFECTIVE ASYNC PROCESSING
 * =============================================================================
 *
 * QStash is Upstash's serverless message queue that works via HTTP callbacks.
 * It's perfect for low-to-medium traffic applications with pay-per-message pricing.
 *
 * PRICING: Free tier (500 msgs/day), then $1 per 100k messages
 *
 * HOW IT WORKS:
 * 1. Your app publishes a message to QStash
 * 2. QStash stores the message and calls your webhook endpoint
 * 3. Your endpoint processes the job and returns success/failure
 * 4. QStash handles retries automatically on failure
 *
 * WHEN TO SWITCH TO KAFKA:
 * - Processing > 10,000 jobs/month consistently
 * - Need advanced features like partitioning, ordering guarantees
 * - Have budget for AWS MSK (~$220/month minimum)
 *
 * =============================================================================
 */

import { Client } from "@upstash/qstash";
import { createId } from "@paralleldrive/cuid2";
import type { CreateImagesFormData } from "~/routes/create";
import type { CreateVideoFormData } from "~/routes/create-video";
import { publishProcessingUpdate } from "./processingStatus.server";
import {
  logGenerationStart,
  logGenerationComplete,
  logGenerationFailed,
} from "./generationLog.server";
import { getModelCreditCost , getVideoModelCreditCost } from "~/config/pricing";

// Initialize QStash client
const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error(
      "QSTASH_TOKEN is not configured. Get it from https://console.upstash.com/qstash"
    );
  }

  return new Client({ token });
};

export interface QStashImageGenerationRequest {
  requestId: string;
  userId: string;
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
  timestamp: string;
}

export interface QStashVideoGenerationRequest {
  requestId: string;
  userId: string;
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
  timestamp: string;
}

export interface QueueResponse {
  requestId: string;
  processingUrl: string;
}

/**
 * Check if we're in local development mode
 * In local dev, QStash can't callback to localhost, so we process differently
 */
function isLocalDevelopment(): boolean {
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  return (
    baseUrl.includes("localhost") ||
    baseUrl.includes("127.0.0.1") ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Queue an image generation request via QStash
 * Returns immediately with a request ID for tracking
 *
 * In local development: Processes the job immediately (simulates QStash callback)
 * In production: Queues to QStash which calls back to your webhook
 */
export async function queueImageGenerationQStash(
  formData: CreateImagesFormData,
  userId: string
): Promise<QueueResponse> {
  const requestId = createId();

  const request: QStashImageGenerationRequest = {
    requestId,
    userId,
    prompt: formData.prompt,
    numberOfImages: formData.numberOfImages,
    model: formData.model,
    stylePreset: formData.stylePreset,
    private: formData.private || false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Set initial status to queued
    console.log(`[QStash] Setting initial status for request: ${requestId}`);
    await publishProcessingUpdate(requestId, {
      userId,
      status: "queued",
      progress: 0,
      message: "Your image generation request has been queued...",
      timestamp: new Date(),
    });
    console.log(`[QStash] Initial status set successfully for request: ${requestId}`);

    if (isLocalDevelopment()) {
      // LOCAL DEV: Process immediately in background (don't await)
      // This simulates QStash calling back to our webhook
      console.log(
        `[QStash] Local dev mode - processing request ${requestId} immediately`
      );

      // Import and call the processor directly (non-blocking)
      processImageGenerationLocally(request).catch((err) => {
        console.error(`[QStash] Local processing failed for ${requestId}:`, err);
      });
    } else {
      // PRODUCTION: Queue to QStash for async processing
      const client = getQStashClient();
      const baseUrl = process.env.BASE_URL || "http://localhost:5173";
      const callbackUrl = `${baseUrl}/api/queue/process-image`;

      await client.publishJSON({
        url: callbackUrl,
        body: request,
        retries: 3,
      });

      console.log(
        `[QStash] Queued image generation request: ${requestId} for user: ${userId}`
      );
    }

    return {
      requestId,
      processingUrl: `/processing/${requestId}`,
    };
  } catch (error) {
    console.error("[QStash] Failed to queue image generation:", error);

    // Update status to failed
    await publishProcessingUpdate(requestId, {
      userId,
      status: "failed",
      progress: 0,
      message: "Failed to queue image generation request",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    });

    throw new Error(
      `Failed to queue image generation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Verify that a request came from QStash (security check)
 */
export async function verifyQStashSignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!signature) {
    console.warn("[QStash] No signature provided");
    return false;
  }

  try {
    const { Receiver } = await import("@upstash/qstash");
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
    });

    const isValid = await receiver.verify({
      signature,
      body,
    });

    return isValid;
  } catch (error) {
    console.error("[QStash] Signature verification failed:", error);
    return false;
  }
}

/**
 * Health check for QStash connection
 */
export async function checkQStashHealth(): Promise<boolean> {
  try {
    // In local dev, we don't need QStash credentials
    if (isLocalDevelopment()) {
      return true;
    }
    // Just verify we can create a client (token is valid)
    getQStashClient();
    return true;
  } catch (error) {
    console.error("[QStash] Health check failed:", error);
    return false;
  }
}

/**
 * Queue a video generation request via QStash
 * Returns immediately with a request ID for tracking
 *
 * In local development: Processes the job immediately (simulates QStash callback)
 * In production: Queues to QStash which calls back to your webhook
 */
export async function queueVideoGenerationQStash(
  formData: CreateVideoFormData,
  userId: string
): Promise<QueueResponse> {
  const requestId = createId();

  const request: QStashVideoGenerationRequest = {
    requestId,
    userId,
    prompt: formData.prompt,
    model: formData.model,
    duration: formData.duration,
    aspectRatio: formData.aspectRatio,
    sourceImageUrl: formData.sourceImageUrl,
    sourceImageId: formData.sourceImageId,
    private: formData.private || false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Set initial status to queued
    console.log(`[QStash Video] Setting initial status for request: ${requestId}`);
    await publishProcessingUpdate(requestId, {
      userId,
      status: "queued",
      progress: 0,
      message: "Your video generation request has been queued...",
      timestamp: new Date(),
    });
    console.log(`[QStash Video] Initial status set successfully for request: ${requestId}`);

    if (isLocalDevelopment()) {
      // LOCAL DEV: Process immediately in background (don't await)
      // This simulates QStash calling back to our webhook
      console.log(
        `[QStash Video] Local dev mode - processing request ${requestId} immediately`
      );

      // Import and call the processor directly (non-blocking)
      processVideoGenerationLocally(request).catch((err) => {
        console.error(`[QStash Video] Local processing failed for ${requestId}:`, err);
      });
    } else {
      // PRODUCTION: Queue to QStash for async processing
      const client = getQStashClient();
      const baseUrl = process.env.BASE_URL || "http://localhost:5173";
      const callbackUrl = `${baseUrl}/api/queue/process-video`;

      await client.publishJSON({
        url: callbackUrl,
        body: request,
        retries: 3,
      });

      console.log(
        `[QStash Video] Queued video generation request: ${requestId} for user: ${userId}`
      );
    }

    return {
      requestId,
      processingUrl: `/processing/${requestId}?type=video`,
    };
  } catch (error) {
    console.error("[QStash Video] Failed to queue video generation:", error);

    // Update status to failed
    await publishProcessingUpdate(requestId, {
      userId,
      status: "failed",
      progress: 0,
      message: "Failed to queue video generation request",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    });

    throw new Error(
      `Failed to queue video generation: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Process image generation locally (for development)
 * This runs the same logic as the QStash webhook but without HTTP
 */
async function processImageGenerationLocally(
  request: QStashImageGenerationRequest
): Promise<void> {
  const { createNewImages } = await import("~/server/createNewImages");
  const { getProcessingStatusService } = await import(
    "./processingStatus.server"
  );

  const { requestId, userId, prompt, numberOfImages, model, stylePreset } =
    request;

  console.log(`[Local Worker] Processing request: ${requestId}`);

  // Calculate credit cost
  const creditCostPerImage = getModelCreditCost(model);
  const totalCreditCost = creditCostPerImage * numberOfImages;

  // Log generation start
  await logGenerationStart({
    requestId,
    userId,
    type: "image",
    prompt,
    model,
    creditCost: totalCreditCost,
    metadata: {
      numberOfImages,
      stylePreset,
    },
  });

  try {
    // Claim the request (prevents duplicate processing)
    const statusService = getProcessingStatusService();
    const claimResult = await statusService.claimProcessingRequest(
      requestId,
      userId,
      "local-worker"
    );

    if (!claimResult.claimed) {
      console.log(
        `[Local Worker] Request ${requestId} already processing, skipping`
      );
      return;
    }

    // Update status to processing
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 10,
      message: `Starting generation of ${numberOfImages} images...`,
      timestamp: new Date(),
    });

    // Prepare form data
    const formData = {
      prompt,
      numberOfImages,
      model,
      stylePreset,
      private: request.private || false,
    };

    // Update progress
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 30,
      message: "Calling AI model...",
      timestamp: new Date(),
    });

    // Generate images
    const result = await createNewImages(formData, userId);

    // Check for errors
    if ("error" in result) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "Unknown error from AI provider"
      );
    }

    if (!result.setId || !result.images?.length) {
      throw new Error("Failed to create images - incomplete response");
    }

    // Update to near completion
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 90,
      message: "Finalizing images...",
      timestamp: new Date(),
    });

    // Success!
    await publishProcessingUpdate(requestId, {
      userId,
      status: "complete",
      progress: 100,
      message: `Successfully generated ${result.images.length} images`,
      setId: result.setId,
      images: result.images,
      timestamp: new Date(),
    });

    // Create notification for image completion (non-blocking)
    // Wrapped in try-catch to prevent notification failures from overwriting success status
    const firstImageId = result.images[0]?.id;
    if (firstImageId) {
      try {
        const { createNotification } = await import("~/server/notifications");
        await createNotification({
          type: "IMAGE_COMPLETED",
          recipientId: userId,
          imageId: firstImageId,
        });
      } catch (notificationError) {
        console.error(
          `[Local Worker] Failed to create notification for ${requestId}:`,
          notificationError
        );
        // Don't rethrow - notification failure shouldn't affect image generation success
      }
    }

    // Log successful generation
    await logGenerationComplete({
      requestId,
      setId: result.setId,
    });

    console.log(
      `[Local Worker] Completed request ${requestId}, setId: ${result.setId}`
    );
  } catch (error) {
    console.error(`[Local Worker] Error processing ${requestId}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await publishProcessingUpdate(requestId, {
      userId,
      status: "failed",
      progress: 0,
      error: errorMessage,
      message: "Failed to generate images. Please try again.",
      timestamp: new Date(),
    });

    // Log failed generation
    await logGenerationFailed({
      requestId,
      errorMessage,
      refundCredits: false, // Credits already deducted in route action
    });
  }
}

/**
 * Process video generation locally (for development)
 * This runs the same logic as the QStash webhook but without HTTP
 */
async function processVideoGenerationLocally(
  request: QStashVideoGenerationRequest
): Promise<void> {
  const { createNewVideos } = await import("~/server/createNewVideos");
  const { getProcessingStatusService } = await import(
    "./processingStatus.server"
  );

  const { requestId, userId, prompt, model, duration, aspectRatio, sourceImageUrl, sourceImageId } =
    request;

  console.log(`[Local Video Worker] Processing request: ${requestId}`);

  // Calculate credit cost based on duration
  const videoDuration = duration || 5;
  const totalCreditCost = getVideoModelCreditCost(model, videoDuration);

  // Log generation start
  await logGenerationStart({
    requestId,
    userId,
    type: "video",
    prompt,
    model,
    creditCost: totalCreditCost,
    metadata: {
      duration,
      aspectRatio,
      sourceImageUrl,
      sourceImageId,
    },
  });

  try {
    // Claim the request (prevents duplicate processing)
    const statusService = getProcessingStatusService();
    const claimResult = await statusService.claimProcessingRequest(
      requestId,
      userId,
      "local-video-worker"
    );

    if (!claimResult.claimed) {
      console.log(
        `[Local Video Worker] Request ${requestId} already processing, skipping`
      );
      return;
    }

    // Update status to processing
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 10,
      message: "Starting video generation...",
      timestamp: new Date(),
    });

    // Prepare form data
    const formData: CreateVideoFormData = {
      prompt,
      model,
      duration,
      aspectRatio,
      sourceImageUrl,
      sourceImageId,
      private: request.private || false,
    };

    // Update progress
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 30,
      message: "Calling AI model...",
      timestamp: new Date(),
    });

    // Generate video
    const result = await createNewVideos(formData, userId);

    // Check for errors
    if ("error" in result && result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "Unknown error from AI provider"
      );
    }

    if (!result.setId || !result.videos?.length) {
      throw new Error("Failed to create video - incomplete response");
    }

    // Update to near completion
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 90,
      message: "Finalizing video...",
      timestamp: new Date(),
    });

    // Success!
    await publishProcessingUpdate(requestId, {
      userId,
      status: "complete",
      progress: 100,
      message: "Successfully generated video",
      setId: result.setId,
      videos: result.videos,
      timestamp: new Date(),
    });

    // Log successful generation
    await logGenerationComplete({
      requestId,
      setId: result.setId,
    });

    console.log(
      `[Local Video Worker] Completed request ${requestId}, setId: ${result.setId}`
    );
  } catch (error) {
    console.error(`[Local Video Worker] Error processing ${requestId}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await publishProcessingUpdate(requestId, {
      userId,
      status: "failed",
      progress: 0,
      error: errorMessage,
      message: "Failed to generate video. Please try again.",
      timestamp: new Date(),
    });

    // Log failed generation
    await logGenerationFailed({
      requestId,
      errorMessage,
      refundCredits: false, // Credits already deducted in route action
    });
  }
}
