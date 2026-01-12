/**
 * =============================================================================
 * QSTASH WEBHOOK ENDPOINT - IMAGE PROCESSING
 * =============================================================================
 *
 * This endpoint is called by QStash to process queued image generation requests.
 * It runs the same image generation logic as the Kafka worker.
 *
 * Security: Verifies QStash signature to ensure requests are legitimate.
 * =============================================================================
 */

import { type ActionFunctionArgs, json } from "@remix-run/node";
import { createNewImages } from "~/server/createNewImages";
import {
  publishProcessingUpdate,
  getProcessingStatusService,
} from "~/services/processingStatus.server";
import {
  verifyQStashSignature,
  type QStashImageGenerationRequest,
} from "~/services/qstash.server";
import { createNotification } from "~/server/notifications";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Only allow POST requests
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.text();
  const signature = request.headers.get("upstash-signature");

  // Verify QStash signature in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const isValid = await verifyQStashSignature(signature, body);
    if (!isValid) {
      console.error("[QStash Worker] Invalid signature, rejecting request");
      return json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let jobRequest: QStashImageGenerationRequest;
  try {
    jobRequest = JSON.parse(body);
  } catch (error) {
    console.error("[QStash Worker] Failed to parse request body:", error);
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { requestId, userId, prompt, numberOfImages, model, stylePreset } =
    jobRequest;

  console.log(`[QStash Worker] Processing request: ${requestId}`);

  try {
    // Atomic deduplication: Try to claim the request for processing
    const statusService = getProcessingStatusService();
    const claimResult = await statusService.claimProcessingRequest(
      requestId,
      userId,
      "qstash-worker"
    );

    if (!claimResult.claimed) {
      console.log(
        `[QStash Worker] Request ${requestId} already being processed by ${claimResult.currentProcessor}, skipping...`
      );
      // Return 200 so QStash doesn't retry
      return json({ status: "already_processing" });
    }

    // Update status to processing
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 10,
      message: `Starting generation of ${numberOfImages} images using ${model}...`,
      timestamp: new Date(),
    });

    // Prepare form data for createNewImages
    const formData = {
      prompt,
      numberOfImages,
      model,
      stylePreset,
      private: jobRequest.private || false,
    };

    // Update progress
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 30,
      message: "Calling AI model...",
      timestamp: new Date(),
    });

    // Generate images - the heavy lifting
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

    // Update progress to near completion
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 90,
      message: "Finalizing images...",
      timestamp: new Date(),
    });

    // Publish success
    await publishProcessingUpdate(requestId, {
      userId,
      status: "complete",
      progress: 100,
      message: `Successfully generated ${result.images.length} images`,
      setId: result.setId,
      images: result.images,
      timestamp: new Date(),
    });

    // Create notification for image completion
    // Use the first image ID from the result if available
    const firstImageId = result.images[0]?.id;
    if (firstImageId) {
      await createNotification({
        type: "IMAGE_COMPLETED",
        recipientId: userId,
        imageId: firstImageId,
      });
    }

    console.log(
      `[QStash Worker] Completed request ${requestId}, setId: ${result.setId}`
    );

    return json({
      status: "complete",
      requestId,
      setId: result.setId,
      imageCount: result.images.length,
    });
  } catch (error) {
    console.error(
      `[QStash Worker] Error processing request ${requestId}:`,
      error
    );

    // Convert technical errors to user-friendly messages
    const getUserFriendlyMessage = (err: string): string => {
      if (
        err.includes("content_policy_violation") ||
        err.includes("safety system")
      ) {
        return "Your prompt was rejected by the AI safety system. Please try rephrasing your request.";
      }
      if (err.includes("billing_hard_limit_reached") || err.includes("quota")) {
        return "AI service quota exceeded. Please try again later.";
      }
      if (err.includes("rate_limit_exceeded")) {
        return "Too many requests. Please wait a moment and try again.";
      }
      if (err.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
      return "Failed to generate images. Please try again.";
    };

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const userFriendlyMessage = getUserFriendlyMessage(errorMessage);

    await publishProcessingUpdate(requestId, {
      userId,
      status: "failed",
      progress: 0,
      error: errorMessage,
      message: userFriendlyMessage,
      timestamp: new Date(),
    });

    // Return 200 so QStash doesn't retry (we've handled the error)
    // Return 500 if you want QStash to retry
    return json({
      status: "failed",
      requestId,
      error: userFriendlyMessage,
    });
  }
};

// Disable loader - this is an API-only route
export const loader = () => {
  return json({ error: "Method not allowed" }, { status: 405 });
};
