/**
 * Video Generation Router
 *
 * This module routes video generation requests to the appropriate
 * AI provider based on the selected model.
 */

import { createRunwayVideo, type CreateVideoFormData } from "./createRunwayVideo";
import { createLumaVideo } from "./createLumaVideo";
import { createStabilityVideo } from "./createStabilityVideo";
import { deleteSet } from "~/server";
import { invariantResponse } from "~/utils/invariantResponse";

const VALID_RUNWAY_MODELS = [
  "runway-gen4-turbo",
  "runway-gen4-aleph",
  // Legacy model values (map to new models)
  "runway-gen3",
  "runway-gen3-turbo",
];
const VALID_LUMA_MODELS = ["luma-dream-machine"];
const VALID_STABILITY_MODELS = ["stability-video"];

const isValidRunwayModel = (model: string) => VALID_RUNWAY_MODELS.includes(model);
const isValidLumaModel = (model: string) => VALID_LUMA_MODELS.includes(model);
const isValidStabilityModel = (model: string) => VALID_STABILITY_MODELS.includes(model);

export interface CreateVideosFormData {
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
}

/**
 * Main video generation function that routes to the appropriate provider
 */
export const createNewVideos = async (
  formData: CreateVideosFormData,
  userId: string,
  onProgress?: (progress: number, status: string) => void
) => {
  const modelToUse = formData.model;

  invariantResponse(modelToUse, "Must select a video model");
  invariantResponse(formData.prompt, "Must provide a prompt");

  let setId = "";

  try {
    // Route to appropriate provider based on model
    if (isValidRunwayModel(modelToUse)) {
      const data = await createRunwayVideo(formData as CreateVideoFormData, userId, onProgress);
      setId = data.setId || "";
      return data;
    } else if (isValidLumaModel(modelToUse)) {
      const data = await createLumaVideo(formData as CreateVideoFormData, userId, onProgress);
      setId = data.setId || "";
      return data;
    } else if (isValidStabilityModel(modelToUse)) {
      const data = await createStabilityVideo(formData as CreateVideoFormData, userId, onProgress);
      setId = data.setId || "";
      return data;
    }

    throw new Error(`Invalid video model: ${modelToUse}`);
  } catch (error) {
    console.error("Video generation error:", error);

    // Clean up on failure
    if (setId) {
      try {
        await deleteSet({ setId });
      } catch (cleanupError) {
        console.error("Error cleaning up set:", cleanupError);
      }
    }

    throw new Error(
      `Failed to create video: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get supported video models
 */
export const getSupportedVideoModels = () => [
  ...VALID_RUNWAY_MODELS,
  ...VALID_LUMA_MODELS,
  ...VALID_STABILITY_MODELS,
];
