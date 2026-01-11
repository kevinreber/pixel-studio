import {
  createNewImage,
  type FormattedCreateImageData,
  getFormattedImageData,
} from "./createNewImage";
import { addBase64EncodedImageToAWS } from "./addBase64EncodedImageToAWS";
import { createNewSet } from "./createNewSet";
import { deleteSet } from "./deleteSet";
import { Logger } from "~/utils/logger.server";
import { CreateImagesFormData } from "~/routes/create";
import { prisma } from "~/services/prisma.server";

/**
 * Together AI API Integration
 * Fast inference for open-source image generation models
 * @see https://docs.together.ai/reference/images
 */

interface TogetherImageResponse {
  id: string;
  model: string;
  object: string;
  data: Array<{
    index: number;
    b64_json: string;
  }>;
}

interface TogetherErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// Model configurations for Together AI
const TOGETHER_MODELS: Record<string, { modelId: string }> = {
  "together-flux-schnell": {
    modelId: "black-forest-labs/FLUX.1-schnell-Free",
  },
  "together-flux-dev": {
    modelId: "black-forest-labs/FLUX.1-dev",
  },
  "together-sdxl": {
    modelId: "stabilityai/stable-diffusion-xl-base-1.0",
  },
  "together-sd-turbo": {
    modelId: "stabilityai/sdxl-turbo",
  },
};

// Configuration constants
const CONFIG = {
  API_BASE_URL: "https://api.together.xyz/v1",
  REQUEST_TIMEOUT: 120000, // 2 minutes for image generation
} as const;

/**
 * Get the Together API key from environment
 */
const getTogetherApiKey = (): string => {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY environment variable is required");
  }
  return apiKey;
};

/**
 * Create an image using Together AI API
 * Together generates images synchronously with base64 response
 */
const createTogetherImage = async (
  formData: CreateImagesFormData
): Promise<string> => {
  const modelConfig = TOGETHER_MODELS[formData.model];
  if (!modelConfig) {
    throw new Error(`Unsupported Together model: ${formData.model}`);
  }

  Logger.info({
    message: `[createTogetherImages.ts]: Creating image for model: ${formData.model}`,
    metadata: { formData },
  });

  const requestBody: Record<string, unknown> = {
    model: modelConfig.modelId,
    prompt: formData.prompt,
    width: formData.width || 1024,
    height: formData.height || 1024,
    steps: formData.steps || 20,
    n: 1,
    response_format: "b64_json",
  };

  // Add optional parameters if provided
  if (formData.negativePrompt) {
    requestBody.negative_prompt = formData.negativePrompt;
  }

  if (formData.seed !== undefined) {
    requestBody.seed = formData.seed;
  }

  // CFG scale (guidance) - some models support this
  if (formData.cfgScale !== undefined) {
    requestBody.guidance = formData.cfgScale;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getTogetherApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as TogetherErrorResponse;
      Logger.error({
        message: `[createTogetherImages.ts]: API Error`,
        metadata: { status: response.status, errorData },
      });

      if (response.status === 400 && errorData.error?.code === "content_policy_violation") {
        throw new Error("Your request was flagged by content moderation. Please revise your prompt.");
      }

      throw new Error(
        `Together API Error: ${errorData.error?.message || response.statusText}`
      );
    }

    const result = (await response.json()) as TogetherImageResponse;

    if (!result.data || result.data.length === 0) {
      throw new Error("No images in response");
    }

    return result.data[0].b64_json;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
};

/**
 * Process a batch of images
 */
const processTogetherBatch = async (
  formData: CreateImagesFormData,
  userId: string,
  setId: string
): Promise<FormattedCreateImageData[]> => {
  const formattedImages: FormattedCreateImageData[] = [];

  for (let i = 0; i < formData.numberOfImages; i++) {
    try {
      Logger.info({
        message: `[createTogetherImages.ts]: Processing image #${i + 1} of ${formData.numberOfImages}`,
      });

      const base64Image = await createTogetherImage(formData);

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
        message: `[createTogetherImages.ts]: Successfully stored image #${i + 1} in S3: ${imageData.id}`,
      });

      formattedImages.push(getFormattedImageData(imageData));
    } catch (error) {
      Logger.error({
        message: `[createTogetherImages.ts]: Failed to process image #${i + 1}`,
        metadata: { error },
      });
      continue;
    }
  }

  return formattedImages;
};

/**
 * Validate input for Together image generation
 */
const validateTogetherInput = (formData: CreateImagesFormData): void => {
  if (!formData.prompt || formData.prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  if (!formData.model || !TOGETHER_MODELS[formData.model]) {
    throw new Error(`Invalid Together model: ${formData.model}`);
  }

  if (formData.numberOfImages <= 0 || formData.numberOfImages > 10) {
    throw new Error("Number of images must be between 1 and 10");
  }

  // Validate dimensions (Together AI supports various sizes)
  const width = formData.width || 1024;
  const height = formData.height || 1024;
  if (width < 256 || width > 1440 || height < 256 || height > 1440) {
    throw new Error("Image dimensions must be between 256 and 1440 pixels");
  }
};

/**
 * Main function to create images using Together AI API
 */
export const createTogetherImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  Logger.info({
    message: `[createTogetherImages.ts]: Creating images using Together model: ${formData.model}`,
    metadata: { formData },
  });

  validateTogetherInput(formData);
  let setId = "";
  let createdImages: string[] = [];

  try {
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    const images = await processTogetherBatch(formData, userId, setId);
    createdImages = images.map((img) => img.id);

    return { images, setId };
  } catch (error) {
    Logger.error({
      message: `[createTogetherImages.ts]: Error generating images from Together`,
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
            message: `[createTogetherImages.ts]: Failed to delete set after error`,
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

    throw new Error(`Failed to create images from Together: ${error}`);
  }
};

/**
 * List of valid Together models for validation
 */
export const VALID_TOGETHER_MODELS = Object.keys(TOGETHER_MODELS);

/**
 * Check if a model is a valid Together model
 */
export const isValidTogetherModel = (model: string): boolean => {
  return VALID_TOGETHER_MODELS.includes(model);
};
