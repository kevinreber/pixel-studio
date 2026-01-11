/**
 * Stability AI Video Generation Integration
 *
 * This module handles video generation using Stability AI's Stable Video Diffusion.
 * Stability primarily offers image-to-video capabilities.
 *
 * API Documentation: https://platform.stability.ai/docs/api-reference
 */

import { createNewVideo, updateVideoStatus } from "./createNewVideo";
import { createNewSet, deleteSet } from "~/server";
import { addVideoToS3 } from "./addVideoToS3.server";

const STABILITY_API_URL =
  process.env.STABILITY_API_URL || "https://api.stability.ai/v2beta";
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

// Polling configuration
const POLLING_INTERVAL = 3000;
const MAX_POLLING_ATTEMPTS = 200;
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

interface StabilityGenerationResponse {
  id: string;
  status: "in-progress" | "complete" | "failed";
  video?: string; // URL or base64
  errors?: string[];
}

/**
 * Convert image URL to base64 for Stability API
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

/**
 * Start a video generation request with Stability
 */
async function startStabilityGeneration(
  sourceImageUrl: string,
  seed?: number,
  cfgScale?: number
): Promise<{ id: string }> {
  if (!STABILITY_API_KEY) {
    throw new Error("STABILITY_API_KEY is not configured");
  }

  // Stability's video API requires an image input
  const imageBase64 = await imageUrlToBase64(sourceImageUrl);

  const formData = new FormData();

  // Convert base64 to Blob
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });
  formData.append("image", imageBlob, "image.png");

  if (seed !== undefined) {
    formData.append("seed", seed.toString());
  }
  if (cfgScale !== undefined) {
    formData.append("cfg_scale", cfgScale.toString());
  }

  const response = await fetch(`${STABILITY_API_URL}/image-to-video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
    },
    body: formData,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Stability API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Poll for video generation status
 */
async function pollStabilityStatus(
  taskId: string
): Promise<StabilityGenerationResponse> {
  if (!STABILITY_API_KEY) {
    throw new Error("STABILITY_API_KEY is not configured");
  }

  const response = await fetch(
    `${STABILITY_API_URL}/image-to-video/result/${taskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STABILITY_API_KEY}`,
        Accept: "video/*",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    }
  );

  if (response.status === 202) {
    // Still processing
    return {
      id: taskId,
      status: "in-progress",
    };
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Stability status check error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  // Success - video is returned directly
  const videoBuffer = await response.arrayBuffer();
  const videoBase64 = Buffer.from(videoBuffer).toString("base64");

  return {
    id: taskId,
    status: "complete",
    video: videoBase64,
  };
}

/**
 * Wait for video generation to complete
 */
async function waitForCompletion(
  taskId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<Buffer> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const status = await pollStabilityStatus(taskId);

    // Estimate progress
    const progress = Math.min(
      Math.floor((attempts / MAX_POLLING_ATTEMPTS) * 90) + 10,
      90
    );

    if (onProgress) {
      onProgress(progress, status.status);
    }

    if (status.status === "complete" && status.video) {
      if (onProgress) {
        onProgress(100, "complete");
      }
      return Buffer.from(status.video, "base64");
    }

    if (status.status === "failed") {
      throw new Error(status.errors?.join(", ") || "Video generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  throw new Error("Video generation timed out");
}

/**
 * Main function to create a new Stability video
 */
export const createStabilityVideo = async (
  formData: CreateVideoFormData,
  userId: string,
  onProgress?: (progress: number, status: string) => void
) => {
  let setId = "";

  // Stability requires a source image
  if (!formData.sourceImageUrl) {
    return {
      error: "Stability Video requires a source image. Please upload or select an image.",
      setId: "",
      videos: [],
    };
  }

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
      duration: 4, // Stability videos are ~4 seconds
      aspectRatio: formData.aspectRatio,
      sourceImageId: formData.sourceImageId,
      sourceImageUrl: formData.sourceImageUrl,
      status: "pending",
    });

    // Start Stability generation
    const { id: taskId } = await startStabilityGeneration(formData.sourceImageUrl);

    // Update video with external ID
    await updateVideoStatus({
      videoId: video.id,
      status: "processing",
      externalId: taskId,
    });

    // Wait for completion
    const videoBuffer = await waitForCompletion(taskId, async (progress, status) => {
      await updateVideoStatus({
        videoId: video.id,
        progress,
        status: status === "in-progress" ? "processing" : status,
      });

      if (onProgress) {
        onProgress(progress, status);
      }
    });

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
    console.error("Stability video generation error:", error);

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
          : "Failed to generate video with Stability",
      setId: "",
      videos: [],
    };
  }
};
