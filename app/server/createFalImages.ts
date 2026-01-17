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
 * Fal.ai API Integration
 * Fast inference platform with many image generation models
 * @see https://fal.ai/docs
 */

interface FalQueueResponse {
  request_id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
}

interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  logs?: Array<{ message: string; timestamp: string }>;
}

interface FalResultResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
  timings?: {
    inference: number;
  };
}

interface FalErrorResponse {
  detail: string | Array<{ msg: string }>;
}

// Model configurations for Fal.ai (unique offerings only - no Flux duplicates)
const FAL_MODELS: Record<string, { endpoint: string; inputMapper: (formData: CreateImagesFormData) => Record<string, unknown> }> = {
  "fal-sdxl-lightning": {
    endpoint: "fal-ai/fast-lightning-sdxl",
    inputMapper: (formData) => ({
      prompt: formData.prompt,
      negative_prompt: formData.negativePrompt || "",
      image_size: {
        width: formData.width || 1024,
        height: formData.height || 1024,
      },
      num_inference_steps: 4, // Lightning is optimized for 4 steps
      num_images: 1,
      enable_safety_checker: true,
      ...(formData.seed !== undefined && { seed: formData.seed }),
    }),
  },
  "fal-stable-cascade": {
    endpoint: "fal-ai/stable-cascade",
    inputMapper: (formData) => ({
      prompt: formData.prompt,
      negative_prompt: formData.negativePrompt || "",
      image_size: {
        width: formData.width || 1024,
        height: formData.height || 1024,
      },
      num_inference_steps: formData.steps || 20,
      guidance_scale: formData.cfgScale || 4,
      num_images: 1,
      enable_safety_checker: true,
      ...(formData.seed !== undefined && { seed: formData.seed }),
    }),
  },
};

// Configuration constants
const CONFIG = {
  API_BASE_URL: "https://queue.fal.run",
  POLLING_INTERVAL: 500, // Fal is fast, so poll more frequently
  MAX_POLLING_ATTEMPTS: 240, // 2 minutes with 500ms interval
  REQUEST_TIMEOUT: 30000,
} as const;

/**
 * Get the Fal API key from environment
 */
const getFalApiKey = (): string => {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY environment variable is required");
  }
  return apiKey;
};

/**
 * Submit a generation request to Fal's queue
 */
const submitFalRequest = async (
  formData: CreateImagesFormData
): Promise<string> => {
  const modelConfig = FAL_MODELS[formData.model];
  if (!modelConfig) {
    throw new Error(`Unsupported Fal model: ${formData.model}`);
  }

  Logger.info({
    message: `[createFalImages.ts]: Submitting request for model: ${formData.model}`,
    metadata: { formData },
  });

  const response = await fetch(`${CONFIG.API_BASE_URL}/${modelConfig.endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${getFalApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modelConfig.inputMapper(formData)),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as FalErrorResponse;
    Logger.error({
      message: `[createFalImages.ts]: API Error`,
      metadata: { status: response.status, errorData },
    });

    const errorMessage = Array.isArray(errorData.detail)
      ? errorData.detail.map((d) => d.msg).join(", ")
      : errorData.detail || response.statusText;

    throw new Error(`Fal API Error: ${errorMessage}`);
  }

  const queueResponse = (await response.json()) as FalQueueResponse;
  return queueResponse.request_id;
};

/**
 * Get the status of a queued request
 */
const getFalRequestStatus = async (
  requestId: string,
  endpoint: string
): Promise<FalStatusResponse> => {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/${endpoint}/requests/${requestId}/status`,
    {
      headers: {
        Authorization: `Key ${getFalApiKey()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get request status: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get the result of a completed request
 */
const getFalResult = async (
  requestId: string,
  endpoint: string
): Promise<FalResultResponse> => {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/${endpoint}/requests/${requestId}`,
    {
      headers: {
        Authorization: `Key ${getFalApiKey()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get result: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Poll for request completion and return the result
 */
const pollForFalResult = async (
  requestId: string,
  model: string
): Promise<string> => {
  const modelConfig = FAL_MODELS[model];
  let attempts = 0;
  let delay: number = CONFIG.POLLING_INTERVAL;

  while (attempts < CONFIG.MAX_POLLING_ATTEMPTS) {
    Logger.info({
      message: `[createFalImages.ts]: Polling attempt #${attempts + 1} for request: ${requestId}`,
    });

    const status = await getFalRequestStatus(requestId, modelConfig.endpoint);

    if (status.status === "COMPLETED") {
      const result = await getFalResult(requestId, modelConfig.endpoint);

      if (!result.images || result.images.length === 0) {
        throw new Error("No images in response");
      }

      return await convertImageUrlToBase64(result.images[0].url);
    }

    if (status.status === "FAILED") {
      throw new Error("Image generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    // Slight backoff but keep it fast for Fal
    delay = Math.min(delay * 1.2, 2000);
    attempts++;
  }

  throw new Error(`Timeout after ${CONFIG.MAX_POLLING_ATTEMPTS} polling attempts`);
};

/**
 * Process a batch of images
 */
const processFalBatch = async (
  formData: CreateImagesFormData,
  userId: string,
  setId: string
): Promise<FormattedCreateImageData[]> => {
  const formattedImages: FormattedCreateImageData[] = [];

  for (let i = 0; i < formData.numberOfImages; i++) {
    try {
      const requestId = await submitFalRequest(formData);
      Logger.info({
        message: `[createFalImages.ts]: Successfully submitted request #${i + 1}: ${requestId}`,
      });

      const base64Image = await pollForFalResult(requestId, formData.model);

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
      });

      await addBase64EncodedImageToAWS(base64Image, imageData.id);
      Logger.info({
        message: `[createFalImages.ts]: Successfully stored image #${i + 1} in S3: ${imageData.id}`,
      });

      formattedImages.push(getFormattedImageData(imageData));
    } catch (error) {
      Logger.error({
        message: `[createFalImages.ts]: Failed to process image #${i + 1}`,
        metadata: { error },
      });
      continue;
    }
  }

  return formattedImages;
};

/**
 * Validate input for Fal image generation
 */
const validateFalInput = (formData: CreateImagesFormData): void => {
  if (!formData.prompt || formData.prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  if (!formData.model || !FAL_MODELS[formData.model]) {
    throw new Error(`Invalid Fal model: ${formData.model}`);
  }

  if (formData.numberOfImages <= 0 || formData.numberOfImages > 10) {
    throw new Error("Number of images must be between 1 and 10");
  }
};

/**
 * Main function to create images using Fal.ai API
 */
export const createFalImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  Logger.info({
    message: `[createFalImages.ts]: Creating images using Fal model: ${formData.model}`,
    metadata: { formData },
  });

  validateFalInput(formData);
  let setId = "";
  let createdImages: string[] = [];

  try {
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    const images = await processFalBatch(formData, userId, setId);
    createdImages = images.map((img) => img.id);

    return { images, setId };
  } catch (error) {
    Logger.error({
      message: `[createFalImages.ts]: Error generating images from Fal`,
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
            message: `[createFalImages.ts]: Failed to delete set after error`,
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

    throw new Error(`Failed to create images from Fal: ${error}`);
  }
};

/**
 * List of valid Fal models for validation
 */
export const VALID_FAL_MODELS = Object.keys(FAL_MODELS);

/**
 * Check if a model is a valid Fal model
 */
export const isValidFalModel = (model: string): boolean => {
  return VALID_FAL_MODELS.includes(model);
};
