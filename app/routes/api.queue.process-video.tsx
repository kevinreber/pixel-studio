/**
 * =============================================================================
 * QSTASH WEBHOOK ENDPOINT - VIDEO PROCESSING
 * =============================================================================
 *
 * This endpoint is called by QStash to process queued video generation requests.
 * It mirrors api.queue.process-image.tsx and the local worker in qstash.server.ts.
 *
 * Security: Verifies QStash signature to ensure requests are legitimate.
 * =============================================================================
 */

import { type ActionFunctionArgs, json } from "@remix-run/node";
import { createNewVideos } from "~/server/createNewVideos";
import {
  publishProcessingUpdate,
  getProcessingStatusService,
} from "~/services/processingStatus.server";
import {
  verifyQStashSignature,
  type QStashVideoGenerationRequest,
} from "~/services/qstash.server";
import {
  logGenerationStart,
  logGenerationComplete,
  logGenerationFailed,
} from "~/services/generationLog.server";
import { getVideoModelCreditCost } from "~/config/pricing";

// Convert technical provider errors into something the user can act on
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
  return "Failed to generate video. Please try again.";
};

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
      console.error(
        "[QStash Video Worker] Invalid signature, rejecting request"
      );
      return json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let jobRequest: QStashVideoGenerationRequest;
  try {
    jobRequest = JSON.parse(body);
  } catch (error) {
    console.error("[QStash Video Worker] Failed to parse request body:", error);
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    requestId,
    userId,
    prompt,
    model,
    duration,
    aspectRatio,
    sourceImageUrl,
    sourceImageId,
  } = jobRequest;

  console.log(`[QStash Video Worker] Processing request: ${requestId}`);

  try {
    // Atomic deduplication: try to claim the request before doing any work
    const statusService = getProcessingStatusService();
    const claimResult = await statusService.claimProcessingRequest(
      requestId,
      userId,
      "qstash-video-worker"
    );

    if (!claimResult.claimed) {
      console.log(
        `[QStash Video Worker] Request ${requestId} already being processed by ${claimResult.currentProcessor}, skipping...`
      );
      // Return 200 so QStash doesn't retry
      return json({ status: "already_processing" });
    }

    await logGenerationStart({
      requestId,
      userId,
      type: "video",
      prompt,
      model,
      creditCost: getVideoModelCreditCost(model, duration || 5),
      metadata: { duration, aspectRatio, sourceImageUrl, sourceImageId },
    });

    // Update status to processing
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 10,
      message: `Starting video generation using ${model}...`,
      timestamp: new Date(),
    });

    const formData = {
      prompt,
      model,
      duration,
      aspectRatio,
      sourceImageUrl,
      sourceImageId,
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

    // Generate the video - the heavy lifting
    const result = await createNewVideos(formData, userId);

    // Check for errors from AI providers
    if ("error" in result && result.error) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "Unknown error from AI provider"
      );
    }

    // Validate result
    if (!result.setId || !result.videos?.length) {
      throw new Error(
        "Failed to create video - incomplete response from AI provider"
      );
    }

    // Update progress to near completion
    await publishProcessingUpdate(requestId, {
      userId,
      status: "processing",
      progress: 90,
      message: "Finalizing video...",
      timestamp: new Date(),
    });

    // Publish success
    await publishProcessingUpdate(requestId, {
      userId,
      status: "complete",
      progress: 100,
      message: "Successfully generated video",
      setId: result.setId,
      videos: result.videos,
      timestamp: new Date(),
    });

    await logGenerationComplete({ requestId, setId: result.setId });

    console.log(
      `[QStash Video Worker] Completed request ${requestId}, setId: ${result.setId}`
    );

    return json({
      status: "complete",
      requestId,
      setId: result.setId,
      videoCount: result.videos.length,
    });
  } catch (error) {
    console.error(
      `[QStash Video Worker] Error processing request ${requestId}:`,
      error
    );

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

    // Credits are charged upfront in the route action, so this is the only
    // place a production failure can give them back.
    await logGenerationFailed({
      requestId,
      errorMessage,
      refundCredits: true,
    });

    // Return 200 so QStash doesn't retry (we've handled the error)
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
