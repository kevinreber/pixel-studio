/**
 * Runway Gen-3 Alpha Video Generation Integration
 *
 * This module handles video generation using Runway's Gen-3 API.
 * Runway offers both text-to-video and image-to-video capabilities.
 *
 * API Documentation: https://docs.dev.runwayml.com/
 */

import { createNewVideo, updateVideoStatus } from "./createNewVideo";
import { createNewSet, deleteSet } from "~/server";
import { addVideoToS3 } from "./addVideoToS3.server";
import { storeSourceImage } from "./storeSourceImage.server";

const RUNWAY_API_URL = process.env.RUNWAY_API_URL || "https://api.dev.runwayml.com/v1";
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;

// Polling configuration
const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 300; // 10 minutes max (2s * 300 = 600s)
const REQUEST_TIMEOUT = 60000; // 60 seconds per request

export interface RunwayVideoRequest {
  prompt: string;
  model: string;
  duration?: number; // Duration in seconds (5-10 for Gen-3)
  aspectRatio?: string; // "16:9", "9:16", "1:1"
  sourceImageUrl?: string; // For image-to-video
  seed?: number;
}

export interface RunwayVideoResponse {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "throttled" | "running";
  progress?: number;
  output?: {
    url: string;
    duration: number;
    fps: number;
  };
  error?: string;
}

export interface CreateVideoFormData {
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
}

/**
 * Convert aspect ratio from UI format to Runway API format
 * Valid Runway ratios: 1280:720, 720:1280, 1104:832, 832:1104, 960:960
 */
function convertAspectRatio(aspectRatio: string): string {
  const ratioMap: Record<string, string> = {
    "16:9": "1280:720",
    "9:16": "720:1280",
    "1:1": "960:960",
    // Direct pixel ratios pass through
    "1280:720": "1280:720",
    "720:1280": "720:1280",
    "960:960": "960:960",
    "1104:832": "1104:832",
    "832:1104": "832:1104",
  };
  return ratioMap[aspectRatio] || "1280:720";
}

/**
 * Get the appropriate Runway API model based on generation type
 *
 * Image-to-Video models: gen4_turbo, gen3a_turbo, veo3.1, veo3.1_fast, veo3
 * Text-to-Video models: veo3.1, veo3.1_fast, veo3
 */
function getRunwayApiModel(modelValue: string, isImageToVideo: boolean): string {
  if (isImageToVideo) {
    // Image-to-video models
    const imageModelMap: Record<string, string> = {
      "runway-gen4-turbo": "gen3a_turbo",
      "runway-gen4-aleph": "gen3a_turbo", // Use gen3a_turbo for image-to-video
      "runway-gen3": "gen3a_turbo",
      "runway-gen3-turbo": "gen3a_turbo",
    };
    return imageModelMap[modelValue] || "gen3a_turbo";
  } else {
    // Text-to-video models (only veo3 family supported)
    return "veo3.1";
  }
}

/**
 * Start a video generation request with Runway
 */
async function startRunwayGeneration(
  request: RunwayVideoRequest
): Promise<{ id: string }> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY is not configured");
  }

  const isImageToVideo = Boolean(request.sourceImageUrl);
  const apiModel = getRunwayApiModel(request.model, isImageToVideo);
  const apiRatio = convertAspectRatio(request.aspectRatio || "16:9");

  const endpoint = isImageToVideo
    ? `${RUNWAY_API_URL}/image_to_video`
    : `${RUNWAY_API_URL}/text_to_video`;

  const body: Record<string, unknown> = {
    model: apiModel,
    promptText: request.prompt,
    ratio: apiRatio,
  };

  // Duration varies by endpoint
  if (isImageToVideo) {
    // Image-to-video: 2-10 seconds
    body.duration = Math.min(Math.max(request.duration || 5, 2), 10);
  } else {
    // Text-to-video: only 4, 6, or 8 seconds
    const duration = request.duration || 6;
    body.duration = duration <= 4 ? 4 : duration <= 6 ? 6 : 8;
  }

  if (isImageToVideo && request.sourceImageUrl) {
    body.promptImage = request.sourceImageUrl;
  }

  if (request.seed !== undefined) {
    body.seed = request.seed;
  }

  console.log(`Calling Runway API: ${endpoint}`, { model: apiModel, ratio: apiRatio, duration: body.duration });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Runway API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Poll for video generation status
 * Runway API returns status values: PENDING, THROTTLED, RUNNING, SUCCEEDED, FAILED
 */
async function pollRunwayStatus(taskId: string): Promise<RunwayVideoResponse> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY is not configured");
  }

  const response = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Runway status check error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();

  // Normalize status to lowercase for consistent handling
  const status = (data.status || "").toLowerCase();

  console.log(`Runway task ${taskId} status:`, { status, progress: data.progress, output: data.output });

  return {
    id: data.id,
    status: status as "pending" | "processing" | "succeeded" | "failed",
    progress: data.progress || 0,
    output: data.output
      ? {
          url: Array.isArray(data.output) ? data.output[0] : data.output,
          duration: data.duration || 5,
          fps: data.fps || 24,
        }
      : undefined,
    error: data.failure || data.error,
  };
}

/**
 * Wait for video generation to complete with polling
 */
async function waitForVideoCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<RunwayVideoResponse> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const status = await pollRunwayStatus(taskId);

    if (onProgress) {
      onProgress(status.progress || 0, status.status);
    }

    // Check for success (handle both "succeeded" and "running" with output)
    if (status.status === "succeeded") {
      return status;
    }

    // Check for failure
    if (status.status === "failed") {
      throw new Error(status.error || "Video generation failed");
    }

    // Check for throttled - log but continue polling
    if (status.status === "throttled") {
      console.log(`Task ${taskId} is throttled, continuing to poll...`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  throw new Error("Video generation timed out");
}

/**
 * Download video from URL and return as buffer
 */
async function downloadVideo(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT * 2),
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Main function to create a new Runway video
 */
export const createRunwayVideo = async (
  formData: CreateVideoFormData,
  userId: string,
  onProgress?: (progress: number, status: string) => void
) => {
  let setId = "";

  try {
    // Store source image if provided (ensures we have a persistent copy)
    let sourceImageUrl = formData.sourceImageUrl;
    let sourceImageId = formData.sourceImageId;

    if (sourceImageUrl) {
      console.log("Storing source image for video generation...");
      const storedImage = await storeSourceImage(sourceImageUrl);
      sourceImageUrl = storedImage.url;
      sourceImageId = storedImage.sourceImageId || sourceImageId;

      if (storedImage.wasExternal) {
        console.log(`External image stored to S3: ${storedImage.url}`);
      }
    }

    // Create a set to group the video
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    // Create initial video record in pending state
    const video = await createNewVideo({
      prompt: formData.prompt,
      userId,
      model: formData.model,
      isVideoPrivate: formData.private || false,
      setId,
      duration: formData.duration,
      aspectRatio: formData.aspectRatio,
      sourceImageId,
      sourceImageUrl,
      status: "pending",
    });

    // Start Runway generation (use our S3 URL for reliability)
    const { id: taskId } = await startRunwayGeneration({
      prompt: formData.prompt,
      model: formData.model,
      duration: formData.duration,
      aspectRatio: formData.aspectRatio,
      sourceImageUrl,
    });

    // Update video with external ID
    await updateVideoStatus({
      videoId: video.id,
      status: "processing",
      externalId: taskId,
    });

    // Wait for completion with progress updates
    const result = await waitForVideoCompletion(taskId, async (progress, status) => {
      await updateVideoStatus({
        videoId: video.id,
        progress,
        status: status === "processing" ? "processing" : status,
      });

      if (onProgress) {
        onProgress(progress, status);
      }
    });

    if (!result.output?.url) {
      throw new Error("No video URL in response");
    }

    // Download the video
    const videoBuffer = await downloadVideo(result.output.url);

    // Upload to S3
    await addVideoToS3({
      videoId: video.id,
      videoBuffer,
      contentType: "video/mp4",
    });

    // Update video as complete
    await updateVideoStatus({
      videoId: video.id,
      status: "complete",
      progress: 100,
    });

    return {
      setId,
      videos: [video],
    };
  } catch (error) {
    console.error("Runway video generation error:", error);

    // Clean up on failure
    if (setId) {
      try {
        await deleteSet({ setId });
      } catch (cleanupError) {
        console.error("Error cleaning up set:", cleanupError);
      }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate video with Runway",
      setId: "",
      videos: [],
    };
  }
};
