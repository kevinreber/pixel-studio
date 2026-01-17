import {
  createNewImage,
  type FormattedCreateImageData,
  getFormattedImageData,
} from "./createNewImage";
import { addBase64EncodedImageToAWS } from "./addBase64EncodedImageToAWS";
import { createNewSet } from "./createNewSet";
import { deleteSet } from "./deleteSet";
import { convertImageUrlToBase64 } from "~/utils/convertImageUrlToBase64";
import { Logger } from "~/utils/logger.server";
import { CreateImagesFormData } from "~/routes/create";
import { prisma } from "~/services/prisma.server";

/**
 * Replicate API Integration
 * Provides access to multiple image generation models through a unified API
 * @see https://replicate.com/docs
 */

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls: {
    get: string;
    cancel: string;
  };
}

// Model configurations for Replicate
const REPLICATE_MODELS: Record<
  string,
  { version: string; inputMapper: (formData: CreateImagesFormData) => Record<string, unknown> }
> = {
  "replicate-playground-v2.5": {
    version: "a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
    inputMapper: (formData) => ({
      prompt: formData.prompt,
      negative_prompt: formData.negativePrompt || "",
      width: formData.width || 1024,
      height: formData.height || 1024,
      num_inference_steps: formData.steps || 50,
      guidance_scale: formData.cfgScale || 3,
      ...(formData.seed !== undefined && { seed: formData.seed }),
    }),
  },
  "replicate-kandinsky-2.2": {
    version: "ad9d7879fbffa2874e1d909d1d37d9bc682889cc65b31f7bb00d2362619f194a",
    inputMapper: (formData) => ({
      prompt: formData.prompt,
      negative_prompt: formData.negativePrompt || "",
      width: formData.width || 1024,
      height: formData.height || 1024,
      num_inference_steps: formData.steps || 50,
      ...(formData.seed !== undefined && { seed: formData.seed }),
    }),
  },
};

// Configuration constants
const CONFIG = {
  API_BASE_URL: "https://api.replicate.com/v1",
  POLLING_INTERVAL: 1000,
  MAX_POLLING_ATTEMPTS: 120,
  REQUEST_TIMEOUT: 45000,
} as const;

/**
 * Get the Replicate API key from environment
 */
const getReplicateApiKey = (): string => {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error("REPLICATE_API_TOKEN environment variable is required");
  }
  return apiKey;
};

/**
 * Create a prediction request to Replicate API
 */
const createReplicatePrediction = async (
  formData: CreateImagesFormData
): Promise<string> => {
  const modelConfig = REPLICATE_MODELS[formData.model];
  if (!modelConfig) {
    throw new Error(`Unsupported Replicate model: ${formData.model}`);
  }

  Logger.info({
    message: `[createReplicateImages.ts]: Creating prediction for model: ${formData.model}`,
    metadata: { formData },
  });

  const response = await fetch(`${CONFIG.API_BASE_URL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${getReplicateApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: modelConfig.version,
      input: modelConfig.inputMapper(formData),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    Logger.error({
      message: `[createReplicateImages.ts]: API Error`,
      metadata: { status: response.status, errorData },
    });
    throw new Error(
      `Replicate API Error: ${(errorData as { detail?: string }).detail || response.statusText}`
    );
  }

  const prediction = (await response.json()) as ReplicatePrediction;
  return prediction.id;
};

/**
 * Get the status of a prediction
 */
const getReplicatePredictionStatus = async (
  predictionId: string
): Promise<ReplicatePrediction> => {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/predictions/${predictionId}`,
    {
      headers: {
        Authorization: `Token ${getReplicateApiKey()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get prediction status: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Poll for prediction completion
 */
const pollForReplicateResult = async (predictionId: string): Promise<string> => {
  let attempts = 0;
  let delay: number = CONFIG.POLLING_INTERVAL;

  while (attempts < CONFIG.MAX_POLLING_ATTEMPTS) {
    Logger.info({
      message: `[createReplicateImages.ts]: Polling attempt #${attempts + 1} for prediction: ${predictionId}`,
    });

    const prediction = await getReplicatePredictionStatus(predictionId);

    if (prediction.status === "succeeded" && prediction.output) {
      const imageUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;
      return await convertImageUrlToBase64(imageUrl);
    }

    if (prediction.status === "failed") {
      throw new Error(`Image generation failed: ${prediction.error || "Unknown error"}`);
    }

    if (prediction.status === "canceled") {
      throw new Error("Image generation was canceled");
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 5000);
    attempts++;
  }

  throw new Error(`Timeout after ${CONFIG.MAX_POLLING_ATTEMPTS} polling attempts`);
};

/**
 * Process a batch of images
 */
const processReplicateBatch = async (
  formData: CreateImagesFormData,
  userId: string,
  setId: string
): Promise<FormattedCreateImageData[]> => {
  const formattedImages: FormattedCreateImageData[] = [];

  for (let i = 0; i < formData.numberOfImages; i++) {
    try {
      const predictionId = await createReplicatePrediction(formData);
      Logger.info({
        message: `[createReplicateImages.ts]: Successfully initiated prediction #${i + 1}: ${predictionId}`,
      });

      const base64Image = await pollForReplicateResult(predictionId);

      const imageData = await createNewImage({
        prompt: formData.prompt,
        userId,
        model: formData.model,
        preset: undefined,
        isImagePrivate: false,
        setId,
        width: formData.width || 1024,
        height: formData.height || 1024,
        seed: formData.seed,
        negativePrompt: formData.negativePrompt,
        cfgScale: formData.cfgScale,
        steps: formData.steps,
        // Remix fields
        isRemix: formData.isRemix,
        parentImageId: formData.parentImageId,
      });

      await addBase64EncodedImageToAWS(base64Image, imageData.id);
      Logger.info({
        message: `[createReplicateImages.ts]: Successfully stored image #${i + 1} in S3: ${imageData.id}`,
      });

      formattedImages.push(getFormattedImageData(imageData));
    } catch (error) {
      Logger.error({
        message: `[createReplicateImages.ts]: Failed to process image #${i + 1}`,
        metadata: { error },
      });
      continue;
    }
  }

  return formattedImages;
};

/**
 * Validate input for Replicate image generation
 */
const validateReplicateInput = (formData: CreateImagesFormData): void => {
  if (!formData.prompt || formData.prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  if (!formData.model || !REPLICATE_MODELS[formData.model]) {
    throw new Error(`Invalid Replicate model: ${formData.model}`);
  }

  if (formData.numberOfImages <= 0 || formData.numberOfImages > 10) {
    throw new Error("Number of images must be between 1 and 10");
  }
};

/**
 * Main function to create images using Replicate API
 */
export const createReplicateImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  Logger.info({
    message: `[createReplicateImages.ts]: Creating images using Replicate model: ${formData.model}`,
    metadata: { formData },
  });

  validateReplicateInput(formData);
  let setId = "";
  let createdImages: string[] = [];

  try {
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    const images = await processReplicateBatch(formData, userId, setId);
    createdImages = images.map((img) => img.id);

    return { images, setId };
  } catch (error) {
    Logger.error({
      message: `[createReplicateImages.ts]: Error generating images from Replicate`,
      metadata: { error, formData },
    });

    try {
      if (createdImages.length > 0) {
        await Promise.all(
          createdImages.map(async (imageId) => {
            try {
              await prisma.image.delete({ where: { id: imageId } });
            } catch (deleteError) {
              Logger.error({
                message: `Failed to delete image during cleanup`,
                metadata: { imageId, error: deleteError },
              });
            }
          })
        );
      }

      if (setId) {
        await deleteSet({ setId }).catch((err) =>
          Logger.error({
            message: `[createReplicateImages.ts]: Failed to delete set after error`,
            metadata: { setId, err },
          })
        );
      }
    } catch (cleanupError) {
      Logger.error({
        message: "Error during cleanup after failed image generation",
        metadata: { cleanupError },
      });
    }

    throw new Error(`Failed to create images from Replicate: ${error}`);
  }
};

/**
 * List of valid Replicate models for validation
 */
export const VALID_REPLICATE_MODELS = Object.keys(REPLICATE_MODELS);

/**
 * Check if a model is a valid Replicate model
 */
export const isValidReplicateModel = (model: string): boolean => {
  return VALID_REPLICATE_MODELS.includes(model);
};
