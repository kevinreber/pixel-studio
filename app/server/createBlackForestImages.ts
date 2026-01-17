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

interface BlackForestResponse {
  id: string;
  status: "Ready" | "Error" | "Pending" | "Request Moderated" | "Content Moderated" | "Task not found";
  result?: {
    sample: string; // URL to the generated image
    prompt: string; // Original prompt used
    seed: number; // Seed used for generation
    start_time: number;
    end_time: number;
    duration: number;
  };
  error?: string;
  progress?: number;
  details?: {
    "Moderation Reasons"?: string[];
  };
}

type BlackForestErrorResponse = {
  error: string;
  message: string;
  status: number;
};

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;

// Configuration constants for the API
const CONFIG = {
  // More conservative polling interval for beta API
  POLLING_INTERVAL: 1000, // ms
  // Maximum number of polling attempts before timing out
  MAX_POLLING_ATTEMPTS: 120, // 2 minutes total
  // Timeout for individual API requests
  REQUEST_TIMEOUT: 45000, // 45 seconds
} as const;

/**
 * Wrapper function to add timeout functionality to fetch requests
 * Automatically aborts requests that take too long
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Add API configuration
const API_CONFIG = {
  BASE_URL: process.env.BLACK_FOREST_LABS_API_URL,
  ENDPOINTS: {
    CREATE: (model: string) => `/v1/${model}`,
    GET_RESULT: "/v1/get_result",
  },
} as const;

/**
 * Create an image using Black Forest Labs API (Beta)
 * @param formData - The form data payload
 * @returns The ID of the request
 *
 * @note This API is currently in beta and subject to change
 * @see https://docs.bfl.ml/
 * @example
 * "1c8a8479-0bf8-47b7-a9e6-7a7de7c55e16"
 */
const createBlackForestImage = async (
  formData: CreateImagesFormData
): Promise<string> => {
  Logger.info({
    message: `[createBlackForestImages.ts]: Creating image using Black Forest Labs model: ${formData.model}`,
    metadata: { formData },
  });
  try {
    if (!API_CONFIG.BASE_URL) {
      throw new Error("BLACK_FOREST_LABS_API_URL is not configured");
    }

    const url = new URL(
      API_CONFIG.ENDPOINTS.CREATE(formData.model),
      API_CONFIG.BASE_URL
    ).toString();

    Logger.info({
      message: `[createBlackForestImages.ts]: Creating image using Black Forest Labs model: ${formData.model}`,
      metadata: { formData, url },
    });

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "x-key": process.env.BLACK_FOREST_LABS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          width: formData.width ?? DEFAULT_WIDTH,
          height: formData.height ?? DEFAULT_HEIGHT,
          // Optional parameters
          ...(formData.seed !== undefined && { seed: formData.seed }),
          ...(formData.promptUpsampling && { prompt_upsampling: true }),
        }),
      },
      CONFIG.REQUEST_TIMEOUT
    );

    if (!response.ok) {
      const errorData = (await response.json()) as BlackForestErrorResponse;
      Logger.error({
        message: `[createBlackForestImages.ts]: API Error from Black Forest Labs Beta`,
        metadata: {
          status: response.status,
          statusText: response.statusText,
          errorData,
          formData,
        },
      });
      throw new Error(
        `Beta API Error: ${errorData.message || response.statusText}`
      );
    }

    const responseData = await response.json();
    return responseData.id;
  } catch (error) {
    Logger.error({
      message: `Failed to create Black Forest image`,
      metadata: { error, formData },
    });
    throw error;
  }
};

/**
 * Get the status and result of an image generation request from Black Forest Labs
 * @param requestId - The ID of the request to get the status and result for
 * @returns The status and result of the request
 *
 * @example
 * {
 *   "id": "1c8a8479-0bf8-47b7-a9e6-7a7de7c55e16",
 *   "status": "Ready",
 *   "result": {
 *     "sample": "https://bfldeliverysc.blob.core.windows.net/results/9bdd22c375ee4de2a4a526781485e1a3/sample.jpeg?se=2024-12-01T02%3A02%3A04Z&sp=r&sv=2024-11-04&sr=b&rsct=image/jpeg&sig=QlsyWuVVkbD7Uo6FYD1Am0TEI2zb4j4Lt7B2XFInkbs%3D",
 *     "prompt": "a pirate ship floating through the galaxy among the stars",
 *     "seed": 566575719,
 *     "start_time": 1733017914.4215941,
 *     "end_time": 1733017924.3717163,
 *     "duration": 9.950122117996216
 *   }
 * }
 */
const getBlackForestImageStatus = async (
  requestId: string
): Promise<BlackForestResponse> => {
  Logger.info({
    message: `[createBlackForestImages.ts]: Getting result from Black Forest Labs: ${requestId}`,
    metadata: { requestId },
  });
  const resultResponse = await fetch(
    `${process.env.BLACK_FOREST_LABS_API_URL}/v1/get_result?id=${requestId}`,
    {
      headers: {
        "x-key": process.env.BLACK_FOREST_LABS_API_KEY!,
        accept: "application/json",
      },
    }
  );

  if (!resultResponse.ok) {
    const errorText = await resultResponse.text();
    Logger.error({
      message: `[createBlackForestImages.ts]: Failed to get result from Black Forest Labs`,
      metadata: { requestId, status: resultResponse.status, statusText: resultResponse.statusText, errorText },
    });
    throw new Error(`Failed to get result from Black Forest Labs: ${resultResponse.status} ${resultResponse.statusText} - ${errorText}`);
  }

  return resultResponse.json();
};

/**
 * Polls the API until an image is ready or fails
 * Uses exponential backoff to reduce server load
 *
 * @param requestId - ID returned from initial image creation request
 * @returns Base64 encoded image data
 * @throws Error if polling times out or image generation fails
 */
const pollForBlackForestImageResult = async (
  requestId: string
): Promise<string> => {
  Logger.info({
    message: `[createBlackForestImages.ts]: Polling for result from Black Forest Labs: ${requestId}`,
    metadata: { requestId },
  });
  let attempts = 0;
  let delay: number = CONFIG.POLLING_INTERVAL;

  while (attempts < CONFIG.MAX_POLLING_ATTEMPTS) {
    Logger.info({
      message: `[createBlackForestImages.ts]: Polling attempt #${
        attempts + 1
      } for result from Black Forest Labs: ${requestId}`,
      metadata: { requestId },
    });

    try {
      const resultData = await getBlackForestImageStatus(requestId);
      Logger.info({
        message: `[createBlackForestImages.ts]: Get Black Forest Image result for requestId: ${requestId}`,
        metadata: { requestId, resultData },
      });

      // Image is ready - convert URL to base64 and return
      if (resultData.status === "Ready" && resultData.result) {
        Logger.info({
          message: `[createBlackForestImages.ts]: Converting image URL to base64 for requestId: ${requestId}`,
          metadata: { requestId },
        });
        return await convertImageUrlToBase64(resultData.result.sample);
      }

      // Handle moderation rejection
      if (resultData.status === "Request Moderated" || resultData.status === "Content Moderated") {
        Logger.error({
          message: `[createBlackForestImages.ts]: Request was moderated for requestId: ${requestId}`,
          metadata: { requestId, resultData },
        });
        const reasons =
          resultData.details?.["Moderation Reasons"]?.join(", ") ||
          "Unknown reason";
        throw new Error(
          `Your request was flagged by our content moderation system (${reasons})`
        );
      }

      // Image generation failed
      if (resultData.status === "Error") {
        Logger.error({
          message: `[createBlackForestImages.ts]: Image generation failed for requestId: ${requestId}`,
          metadata: { requestId, resultData },
        });
        throw new Error(
          `Image generation failed: ${resultData.error || "Unknown error"}`
        );
      }

      // Task not found
      if (resultData.status === "Task not found") {
        Logger.error({
          message: `[createBlackForestImages.ts]: Task not found for requestId: ${requestId}`,
          metadata: { requestId, resultData },
        });
        throw new Error(`Task not found: ${requestId}`);
      }

      // Image still processing - wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Increase delay for next attempt, but cap at 5 seconds
      delay = Math.min(delay * 1.5, 5000);
      attempts++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error({
        message: `[createBlackForestImages.ts]: Polling attempt ${
          attempts + 1
        } failed`,
        metadata: { requestId, errorMessage },
      });
      throw error;
    }
  }

  throw new Error(
    `Timeout after ${CONFIG.MAX_POLLING_ATTEMPTS} polling attempts`
  );
};

/**
 * Processes images sequentially to:
 * 1. Minimize API load
 * 2. Provide better error handling per image
 * 3. Enable precise progress tracking
 * 4. Be more conservative with beta API
 *
 * @param formData - User input data including prompt and number of images
 * @param userId - ID of user requesting images
 * @param setId - ID of the image set being created
 * @returns Array of formatted image data objects
 */
const processBatch = async (
  formData: CreateImagesFormData,
  userId: string,
  setId: string
) => {
  const formattedImages: FormattedCreateImageData[] = [];

  // Process one image at a time
  for (let i = 0; i < formData.numberOfImages; i++) {
    try {
      // Step 1: Request image generation
      const requestId = await createBlackForestImage(formData);
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully initiated image generation #${
          i + 1
        } for requestId: ${requestId}`,
      });

      // Step 2: Poll until image is ready
      const base64Image = await pollForBlackForestImageResult(requestId);

      // Step 3: Store image metadata in database with generation parameters
      const imageData = await createNewImage({
        prompt: formData.prompt,
        userId,
        model: formData.model,
        preset: undefined,
        isImagePrivate: false,
        setId,
        // Store generation parameters
        width: formData.width ?? DEFAULT_WIDTH,
        height: formData.height ?? DEFAULT_HEIGHT,
        seed: formData.seed,
        promptUpsampling: formData.promptUpsampling,
      });
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully stored image #${
          i + 1
        } in DB: ${imageData.id}`,
      });

      // Step 4: Store actual image in S3
      await addBase64EncodedImageToAWS(base64Image, imageData.id);
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully stored image #${
          i + 1
        } in S3: ${imageData.id}`,
      });

      // Step 5: Format and add to results
      formattedImages.push(getFormattedImageData(imageData));
    } catch (error) {
      Logger.error({
        message: `[createBlackForestImages.ts]: Failed to process image #${
          i + 1
        }`,
        metadata: { error },
      });
      // Continue with next image instead of failing entire batch
      continue;
    }
  }

  return formattedImages;
};

// Add validation helpers
const validateCreateBlackForestImagesInput = (
  formData: CreateImagesFormData
) => {
  if (!formData.prompt || formData.prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  if (!formData.model) {
    throw new Error("Model is required");
  }

  // Add reasonable limits
  if (formData.numberOfImages <= 0 || formData.numberOfImages > 10) {
    throw new Error("Number of images must be between 1 and 10");
  }

  // Add size validation
  if (
    DEFAULT_WIDTH < 512 ||
    DEFAULT_WIDTH > 1024 ||
    DEFAULT_HEIGHT < 512 ||
    DEFAULT_HEIGHT > 1024
  ) {
    throw new Error("Image dimensions must be between 512 and 1024 pixels");
  }
};

/**
 * Main function to create images using Black Forest Labs API
 * Handles the entire process from validation to cleanup
 *
 * @param formData - User input data
 * @param userId - ID of requesting user
 * @returns Object containing generated images and set ID
 */
export const createBlackForestImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  // Validate all input before making any API calls
  Logger.info({
    message: `[createBlackForestImages.ts]: Creating images using Black Forest Labs model: ${formData.model}`,
    metadata: { formData },
  });
  validateCreateBlackForestImagesInput(formData);
  let setId = "";
  let createdImages: string[] = [];

  try {
    // Create a new set to group the images
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });
    setId = set.id;

    // Process all requested images in batches
    const images = await processBatch(formData, userId, setId);

    // Keep track of successfully created images
    createdImages = images.map((img) => img.id);

    return { images, setId };
  } catch (error) {
    // If anything fails, log error and clean up
    Logger.error({
      message: `[createBlackForestImages.ts]: Error generating images from Black Forest Labs`,
      metadata: { error, formData },
    });

    // Clean up any partially created resources
    try {
      // Delete any images that were created
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

      // Clean up the set if it was created
      if (setId) {
        await deleteSet({ setId }).catch((err) =>
          Logger.error({
            message: `[createBlackForestImages.ts]: Failed to delete set after error`,
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

    throw new Error(`Failed to create images from Black Forest Labs: ${error}`);
  }
};
