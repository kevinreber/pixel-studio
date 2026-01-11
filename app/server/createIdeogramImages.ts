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
 * Ideogram API Integration
 * Specialized for excellent text rendering in images (logos, signs, typography)
 * @see https://ideogram.ai/api
 */

interface IdeogramResponse {
  created: string;
  data: Array<{
    prompt: string;
    resolution: string;
    is_image_safe: boolean;
    seed: number;
    url: string;
  }>;
}

interface IdeogramErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Supported aspect ratios for Ideogram
type IdeogramAspectRatio =
  | "ASPECT_1_1"
  | "ASPECT_16_9"
  | "ASPECT_9_16"
  | "ASPECT_4_3"
  | "ASPECT_3_4"
  | "ASPECT_3_2"
  | "ASPECT_2_3";

// Model configurations
const IDEOGRAM_MODELS: Record<string, { modelId: string }> = {
  "ideogram-v2": { modelId: "V_2" },
  "ideogram-v2-turbo": { modelId: "V_2_TURBO" },
  "ideogram-v1": { modelId: "V_1" },
  "ideogram-v1-turbo": { modelId: "V_1_TURBO" },
};

// Configuration constants
const CONFIG = {
  API_BASE_URL: "https://api.ideogram.ai",
  REQUEST_TIMEOUT: 60000,
} as const;

/**
 * Get the Ideogram API key from environment
 */
const getIdeogramApiKey = (): string => {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("IDEOGRAM_API_KEY environment variable is required");
  }
  return apiKey;
};

/**
 * Convert width/height to Ideogram aspect ratio
 */
const getAspectRatio = (width?: number, height?: number): IdeogramAspectRatio => {
  if (!width || !height) return "ASPECT_1_1";

  const ratio = width / height;

  if (Math.abs(ratio - 1) < 0.1) return "ASPECT_1_1";
  if (Math.abs(ratio - 16 / 9) < 0.1) return "ASPECT_16_9";
  if (Math.abs(ratio - 9 / 16) < 0.1) return "ASPECT_9_16";
  if (Math.abs(ratio - 4 / 3) < 0.1) return "ASPECT_4_3";
  if (Math.abs(ratio - 3 / 4) < 0.1) return "ASPECT_3_4";
  if (Math.abs(ratio - 3 / 2) < 0.1) return "ASPECT_3_2";
  if (Math.abs(ratio - 2 / 3) < 0.1) return "ASPECT_2_3";

  return "ASPECT_1_1";
};

/**
 * Create an image using Ideogram API
 * Ideogram generates images synchronously
 */
const createIdeogramImage = async (
  formData: CreateImagesFormData
): Promise<string[]> => {
  const modelConfig = IDEOGRAM_MODELS[formData.model];
  if (!modelConfig) {
    throw new Error(`Unsupported Ideogram model: ${formData.model}`);
  }

  Logger.info({
    message: `[createIdeogramImages.ts]: Creating image for model: ${formData.model}`,
    metadata: { formData },
  });

  const requestBody = {
    image_request: {
      prompt: formData.prompt,
      model: modelConfig.modelId,
      aspect_ratio: getAspectRatio(formData.width, formData.height),
      magic_prompt_option: "AUTO", // Enables prompt enhancement
      ...(formData.negativePrompt && { negative_prompt: formData.negativePrompt }),
      ...(formData.seed !== undefined && { seed: formData.seed }),
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Api-Key": getIdeogramApiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as IdeogramErrorResponse;
      Logger.error({
        message: `[createIdeogramImages.ts]: API Error`,
        metadata: { status: response.status, errorData },
      });

      if (response.status === 400 && errorData.error?.code === "CONTENT_MODERATION") {
        throw new Error("Your request was flagged by content moderation. Please revise your prompt.");
      }

      throw new Error(
        `Ideogram API Error: ${errorData.error?.message || response.statusText}`
      );
    }

    const result = (await response.json()) as IdeogramResponse;

    // Convert all image URLs to base64
    const base64Images = await Promise.all(
      result.data
        .filter((img) => img.is_image_safe)
        .map((img) => convertImageUrlToBase64(img.url))
    );

    if (base64Images.length === 0) {
      throw new Error("All generated images were flagged as unsafe");
    }

    return base64Images;
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
const processIdeogramBatch = async (
  formData: CreateImagesFormData,
  userId: string,
  setId: string
): Promise<FormattedCreateImageData[]> => {
  const formattedImages: FormattedCreateImageData[] = [];

  for (let i = 0; i < formData.numberOfImages; i++) {
    try {
      // Ideogram can return multiple images per request
      const base64Images = await createIdeogramImage(formData);

      // Process the first image from the response
      const base64Image = base64Images[0];

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
      });

      await addBase64EncodedImageToAWS(base64Image, imageData.id);
      Logger.info({
        message: `[createIdeogramImages.ts]: Successfully stored image #${i + 1} in S3: ${imageData.id}`,
      });

      formattedImages.push(getFormattedImageData(imageData));
    } catch (error) {
      Logger.error({
        message: `[createIdeogramImages.ts]: Failed to process image #${i + 1}`,
        metadata: { error },
      });
      continue;
    }
  }

  return formattedImages;
};

/**
 * Validate input for Ideogram image generation
 */
const validateIdeogramInput = (formData: CreateImagesFormData): void => {
  if (!formData.prompt || formData.prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  if (!formData.model || !IDEOGRAM_MODELS[formData.model]) {
    throw new Error(`Invalid Ideogram model: ${formData.model}`);
  }

  if (formData.numberOfImages <= 0 || formData.numberOfImages > 10) {
    throw new Error("Number of images must be between 1 and 10");
  }
};

/**
 * Main function to create images using Ideogram API
 */
export const createIdeogramImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  Logger.info({
    message: `[createIdeogramImages.ts]: Creating images using Ideogram model: ${formData.model}`,
    metadata: { formData },
  });

  validateIdeogramInput(formData);
  let setId = "";
  let createdImages: string[] = [];

  try {
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    const images = await processIdeogramBatch(formData, userId, setId);
    createdImages = images.map((img) => img.id);

    return { images, setId };
  } catch (error) {
    Logger.error({
      message: `[createIdeogramImages.ts]: Error generating images from Ideogram`,
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
            message: `[createIdeogramImages.ts]: Failed to delete set after error`,
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

    throw new Error(`Failed to create images from Ideogram: ${error}`);
  }
};

/**
 * List of valid Ideogram models for validation
 */
export const VALID_IDEOGRAM_MODELS = Object.keys(IDEOGRAM_MODELS);

/**
 * Check if a model is a valid Ideogram model
 */
export const isValidIdeogramModel = (model: string): boolean => {
  return VALID_IDEOGRAM_MODELS.includes(model);
};
