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
 getProcessingStatus } from "~/services/processingStatus.server";
import {
  verifyQStashSignature,
  type QStashImageGenerationRequest,
  type QStashComparisonChildRequest,
} from "~/services/qstash.server";
import { createNotification } from "~/server/notifications";

// Type guard for comparison child requests
function isComparisonChildRequest(
  req: QStashImageGenerationRequest
): req is QStashComparisonChildRequest {
  return "parentRequestId" in req && !!req.parentRequestId;
}

// Helper to update parent comparison status when a child completes
async function updateParentComparisonStatus(
  parentRequestId: string,
  userId: string,
  model: string,
  modelUpdate: { status: string; progress: number; setId?: string; error?: string }
): Promise<void> {
  // Get current parent status
  const parentStatus = await getProcessingStatus(parentRequestId);
  if (!parentStatus) {
    console.warn(`[QStash Worker] Parent status not found for ${parentRequestId}`);
    return;
  }

  // Update model status
  const modelStatuses = (parentStatus as unknown as { modelStatuses?: Record<string, unknown> })
    .modelStatuses || {};
  modelStatuses[model] = modelUpdate;

  // Calculate overall progress and status
  const statuses = Object.values(modelStatuses) as Array<{ status: string; progress: number }>;
  const completedCount = statuses.filter(
    (s) => s.status === "complete" || s.status === "failed"
  ).length;
  const totalModels = statuses.length;
  const overallProgress = Math.round(
    statuses.reduce((sum, s) => sum + s.progress, 0) / totalModels
  );

  // Determine overall status
  let overallStatus = "processing";
  if (completedCount === totalModels) {
    const failedCount = statuses.filter((s) => s.status === "failed").length;
    if (failedCount === totalModels) {
      overallStatus = "failed";
    } else if (failedCount > 0) {
      overallStatus = "partial";
    } else {
      overallStatus = "complete";
    }
  }

  // Update parent status
  await publishProcessingUpdate(parentRequestId, {
    userId,
    status: overallStatus,
    progress: overallProgress,
    message:
      overallStatus === "complete"
        ? `Successfully generated images with ${totalModels} models`
        : overallStatus === "partial"
        ? `Completed with ${completedCount - statuses.filter((s) => s.status === "failed").length} of ${totalModels} models`
        : overallStatus === "failed"
        ? "All model generations failed"
        : `Generating... (${completedCount}/${totalModels} models complete)`,
    timestamp: new Date(),
    models: Object.keys(modelStatuses),
    modelStatuses,
    comparisonMode: true,
    totalModels,
    completedModels: completedCount,
  } as Parameters<typeof publishProcessingUpdate>[1] & {
    models: string[];
    modelStatuses: Record<string, unknown>;
    comparisonMode: boolean;
    totalModels: number;
    completedModels: number;
  });

  console.log(
    `[QStash Worker] Updated parent ${parentRequestId} status: ${overallStatus} (${completedCount}/${totalModels})`
  );
}

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

  let jobRequest: QStashImageGenerationRequest | QStashComparisonChildRequest;
  try {
    jobRequest = JSON.parse(body);
  } catch (error) {
    console.error("[QStash Worker] Failed to parse request body:", error);
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { requestId, userId, prompt, numberOfImages, model, stylePreset } =
    jobRequest;

  // Check if this is a comparison child request
  const isComparisonChild = isComparisonChildRequest(jobRequest);
  const parentRequestId = isComparisonChild
    ? (jobRequest as QStashComparisonChildRequest).parentRequestId
    : undefined;

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

    // If this is a comparison child, update the parent status
    if (isComparisonChild && parentRequestId) {
      await updateParentComparisonStatus(parentRequestId, userId, model, {
        status: "complete",
        progress: 100,
        setId: result.setId,
      });
    }

    // Create notification for image completion (non-blocking)
    // Wrapped in try-catch to prevent notification failures from overwriting success status
    // Only create notification for non-comparison requests (parent will handle notification)
    const firstImageId = result.images[0]?.id;
    if (firstImageId && !isComparisonChild) {
      try {
        await createNotification({
          type: "IMAGE_COMPLETED",
          recipientId: userId,
          imageId: firstImageId,
        });
      } catch (notificationError) {
        console.error(
          `[QStash Worker] Failed to create notification for ${requestId}:`,
          notificationError
        );
        // Don't rethrow - notification failure shouldn't affect image generation success
      }
    }

    console.log(
      `[QStash Worker] Completed request ${requestId}${isComparisonChild ? ` (child of ${parentRequestId})` : ""}, setId: ${result.setId}`
    );

    return json({
      status: "complete",
      requestId,
      setId: result.setId,
      imageCount: result.images.length,
      parentRequestId,
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

    // If this is a comparison child, update the parent status
    if (isComparisonChild && parentRequestId) {
      await updateParentComparisonStatus(parentRequestId, userId, model, {
        status: "failed",
        progress: 0,
        error: userFriendlyMessage,
      });
    }

    // Return 200 so QStash doesn't retry (we've handled the error)
    // Return 500 if you want QStash to retry
    return json({
      status: "failed",
      requestId,
      error: userFriendlyMessage,
      parentRequestId,
    });
  }
};

// Disable loader - this is an API-only route
export const loader = () => {
  return json({ error: "Method not allowed" }, { status: 405 });
};
