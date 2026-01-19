/**
 * Luma Dream Machine Video Generation Integration
 *
 * This module handles video generation using Luma's Dream Machine API.
 * Luma offers high-quality text-to-video and image-to-video capabilities.
 *
 * API Documentation: https://docs.lumalabs.ai/
 */

import { createNewVideo, updateVideoStatus } from "./createNewVideo";
import { createNewSet, deleteSet } from "~/server";
import { addVideoToS3, addVideoThumbnailToS3 } from "./addVideoToS3.server";
import { extractVideoThumbnailSafe } from "./extractVideoThumbnail.server";

const LUMA_API_URL = process.env.LUMA_API_URL || "https://api.lumalabs.ai/dream-machine/v1";
const LUMA_API_KEY = process.env.LUMA_API_KEY;

// Polling configuration
const POLLING_INTERVAL = 3000; // 3 seconds
const MAX_POLLING_ATTEMPTS = 200; // ~10 minutes max
const REQUEST_TIMEOUT = 60000;

export interface CreateVideoFormData {
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
}

interface LumaGenerationResponse {
  id: string;
  state: "queued" | "dreaming" | "completed" | "failed";
  failure_reason?: string;
  created_at: string;
  video?: {
    url: string;
    width: number;
    height: number;
    duration_seconds: number;
  };
}

/**
 * Start a video generation request with Luma
 */
async function startLumaGeneration(
  prompt: string,
  aspectRatio?: string,
  sourceImageUrl?: string
): Promise<{ id: string }> {
  if (!LUMA_API_KEY) {
    throw new Error("LUMA_API_KEY is not configured");
  }

  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio || "16:9",
  };

  if (sourceImageUrl) {
    body.keyframes = {
      frame0: {
        type: "image",
        url: sourceImageUrl,
      },
    };
  }

  const response = await fetch(`${LUMA_API_URL}/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LUMA_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Luma API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Poll for video generation status
 */
async function pollLumaStatus(taskId: string): Promise<LumaGenerationResponse> {
  if (!LUMA_API_KEY) {
    throw new Error("LUMA_API_KEY is not configured");
  }

  const response = await fetch(`${LUMA_API_URL}/generations/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${LUMA_API_KEY}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Luma status check error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

/**
 * Wait for video generation to complete
 */
async function waitForCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<LumaGenerationResponse> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const status = await pollLumaStatus(taskId);

    // Estimate progress based on state
    let progress = 0;
    if (status.state === "queued") progress = 10;
    if (status.state === "dreaming") progress = 50;
    if (status.state === "completed") progress = 100;

    if (onProgress) {
      onProgress(progress, status.state);
    }

    if (status.state === "completed") {
      return status;
    }

    if (status.state === "failed") {
      throw new Error(status.failure_reason || "Video generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  throw new Error("Video generation timed out");
}

/**
 * Download video from URL
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
 * Main function to create a new Luma video
 */
export const createLumaVideo = async (
  formData: CreateVideoFormData,
  userId: string,
  onProgress?: (progress: number, status: string) => void
) => {
  let setId = "";

  try {
    // Create a set to group the video
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    // Create initial video record
    const video = await createNewVideo({
      prompt: formData.prompt,
      userId,
      model: formData.model,
      isVideoPrivate: formData.private || false,
      setId,
      duration: formData.duration || 5,
      aspectRatio: formData.aspectRatio,
      sourceImageId: formData.sourceImageId,
      sourceImageUrl: formData.sourceImageUrl,
      status: "pending",
    });

    // Start Luma generation
    const { id: taskId } = await startLumaGeneration(
      formData.prompt,
      formData.aspectRatio,
      formData.sourceImageUrl
    );

    // Update video with external ID
    await updateVideoStatus({
      videoId: video.id,
      status: "processing",
      externalId: taskId,
    });

    // Wait for completion
    const result = await waitForCompletion(taskId, async (progress, status) => {
      await updateVideoStatus({
        videoId: video.id,
        progress,
        status: status === "dreaming" ? "processing" : status,
      });

      if (onProgress) {
        onProgress(progress, status);
      }
    });

    if (!result.video?.url) {
      throw new Error("No video URL in response");
    }

    // Download and upload to S3
    const videoBuffer = await downloadVideo(result.video.url);
    await addVideoToS3({
      videoId: video.id,
      videoBuffer,
      contentType: "video/mp4",
    });

    // Extract and upload thumbnail
    const thumbnailBuffer = await extractVideoThumbnailSafe(videoBuffer);
    if (thumbnailBuffer) {
      await addVideoThumbnailToS3({
        videoId: video.id,
        thumbnailBuffer,
        contentType: "image/jpeg",
      });
      console.log(`Thumbnail generated for video ${video.id}`);
    } else {
      console.warn(`Failed to generate thumbnail for video ${video.id}`);
    }

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
    console.error("Luma video generation error:", error);

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
          : "Failed to generate video with Luma",
      setId: "",
      videos: [],
    };
  }
};
