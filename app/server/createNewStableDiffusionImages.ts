import { setTimeout } from "timers/promises";
import {
  addBase64EncodedImageToAWS,
  createNewImage,
  deleteSet,
} from "~/server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";
import { createNewSet } from "./createNewSet";
import { CreateImagesFormData } from "~/routes/create";
import { Logger } from "~/utils/logger.server";

const MOCK_IMAGE_ID = "stable-diffusion-xl-futuristic-bonsai-tree";
const MOCK_SET_ID = "cm32igx0l0011gbosfbtw33ai";

export const getStableDiffusionMockDataResponse = (numberOfImages = 1) => {
  console.log(
    "⚠️ Warning – Using Stable Diffusion Mock Data *************************"
  );
  const imageURL = getS3BucketURL(MOCK_IMAGE_ID);
  const thumbnailURL = getS3BucketThumbnailURL(MOCK_IMAGE_ID);

  const mockImageData = {
    id: MOCK_IMAGE_ID,
    prompt: "using mock data",
    userId: "testUser123",
    createdAt: "2023-06-26 03:17:19",
    user: {
      userId: "123456789",
      username: "testUser123",
    },
    url: imageURL,
    thumbnailURL,
    comments: [],
  };

  const mockData = new Array(numberOfImages).fill(mockImageData);

  return mockData;
};

const THREE_SECONDS_IN_MS = 1000 * 3;

const DEFAULT_NUMBER_OF_IMAGES_CREATED = 1;
const DEFAULT_AI_IMAGE_LANGUAGE_MODEL = "sd3-large";
const DEFAULT_IMAGE_STYLE_PRESET = undefined;
const DEFAULT_IS_IMAGE_PRIVATE = false;

const DEFAULT_PAYLOAD = {
  prompt: "",
  numberOfImages: DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model: DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  stylePreset: DEFAULT_IMAGE_STYLE_PRESET,
  private: DEFAULT_IS_IMAGE_PRIVATE,
};

interface StabilityAIError {
  id: string;
  name: string;
  message: string;
}

/**
 * Map model IDs to their v2beta API endpoints and model names
 */
const MODEL_CONFIG: Record<string, { endpoint: string; modelParam?: string }> = {
  // SD3 models
  "sd3-medium": { endpoint: "sd3", modelParam: "sd3-medium" },
  "sd3-large": { endpoint: "sd3", modelParam: "sd3-large" },
  "sd3-large-turbo": { endpoint: "sd3", modelParam: "sd3-large-turbo" },
  "sd3.5-medium": { endpoint: "sd3", modelParam: "sd3.5-medium" },
  "sd3.5-large": { endpoint: "sd3", modelParam: "sd3.5-large" },
  "sd3.5-large-turbo": { endpoint: "sd3", modelParam: "sd3.5-large-turbo" },
  // Stable Image Core and Ultra
  "stable-image-core": { endpoint: "core" },
  "stable-image-ultra": { endpoint: "ultra" },
};

/**
 * Convert width/height to aspect ratio for v2beta API
 */
const getAspectRatio = (width?: number, height?: number): string => {
  if (!width || !height) return "1:1";

  const ratio = width / height;

  // Map to supported aspect ratios
  if (ratio >= 2.2) return "21:9";
  if (ratio >= 1.7) return "16:9";
  if (ratio >= 1.4) return "3:2";
  if (ratio >= 1.2) return "5:4";
  if (ratio >= 0.95) return "1:1";
  if (ratio >= 0.75) return "4:5";
  if (ratio >= 0.6) return "2:3";
  if (ratio >= 0.5) return "9:16";
  return "9:21";
};

/**
 * @description
 * This function makes a request to Stability AI's v2beta API to generate images
 *
 * @reference
 * https://platform.stability.ai/docs/api-reference#tag/Generate
 */
const createStableDiffusionImages = async ({
  prompt,
  numberOfImages = DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model = DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  stylePreset = DEFAULT_IMAGE_STYLE_PRESET,
  width,
  height,
  negativePrompt,
  seed,
}: {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  negativePrompt?: string;
  seed?: number;
}): Promise<{ artifacts: Array<{ base64: string; seed: number; finishReason: string }> }> => {
  Logger.info({
    message: `Attempting to generate ${numberOfImages} Stable Diffusion images with ${model} model`,
    metadata: { width, height, hasNegativePrompt: !!negativePrompt },
  });

  const modelConfig = MODEL_CONFIG[model];
  if (!modelConfig) {
    throw new Error(`Unsupported Stability AI model: ${model}. Available models: ${Object.keys(MODEL_CONFIG).join(", ")}`);
  }

  const artifacts: Array<{ base64: string; seed: number; finishReason: string }> = [];

  // Generate images one at a time (v2beta API generates one image per request)
  for (let i = 0; i < numberOfImages; i++) {
    // Build form data for v2beta API (uses multipart/form-data)
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "png");
    formData.append("aspect_ratio", getAspectRatio(width, height));

    if (negativePrompt && negativePrompt.trim()) {
      formData.append("negative_prompt", negativePrompt);
    }

    if (modelConfig.modelParam) {
      formData.append("model", modelConfig.modelParam);
    }

    if (stylePreset && stylePreset !== "none") {
      formData.append("style_preset", stylePreset);
    }

    if (seed !== undefined) {
      formData.append("seed", String(seed + i)); // Increment seed for each image
    }

    try {
      const apiEndpoint = process.env.STABLE_DIFFUSION_API_ENDPOINT || "https://api.stability.ai";
      const response = await fetch(
        `${apiEndpoint}/v2beta/stable-image/generate/${modelConfig.endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
            Accept: "image/*",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorDataText = await response.text();
        Logger.error({
          message: "Stability AI v2beta Error",
          metadata: { errorDataText, status: response.status },
        });

        try {
          const errorData = JSON.parse(errorDataText) as StabilityAIError;
          throw new Error(errorData.message || errorDataText);
        } catch {
          throw new Error(errorDataText || `API error: ${response.status}`);
        }
      }

      // v2beta returns image directly as binary when Accept: image/*
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      // Get seed from response headers if available
      const responseSeed = response.headers.get("seed");

      artifacts.push({
        base64: base64Image,
        seed: responseSeed ? parseInt(responseSeed, 10) : (seed || 0) + i,
        finishReason: "SUCCESS",
      });

      Logger.info({
        message: `Successfully generated image ${i + 1}/${numberOfImages}`,
      });
    } catch (error) {
      Logger.error({
        message: `Error generating image ${i + 1}/${numberOfImages}`,
        error: error as Error,
      });
      throw error;
    }
  }

  return { artifacts };
};

/**
 * @description
 * This function does the following in the listed order:
 *   1. Gets images from Stable Diffusion's API
 *   2. Creates a new Image in our DB using the data returned from "Step 1"
 *   3. Stores the image Blob from "Step 1" into our AWS S3 bucket
 */
export const createNewStableDiffusionImages = async (
  formData: CreateImagesFormData = DEFAULT_PAYLOAD,
  userId: string
) => {
  Logger.info({
    message: "Creating new Stable Diffusion images...",
    metadata: {
      userId,
    },
  });
  const {
    prompt,
    numberOfImages,
    model,
    stylePreset,
    private: isImagePrivate = false,
  } = formData;
  let setId = "";
  try {
    if (process.env.USE_MOCK_DALLE === "tru") {
      const mockData = getStableDiffusionMockDataResponse(numberOfImages);
      await setTimeout(THREE_SECONDS_IN_MS);

      return { images: mockData, setId: MOCK_SET_ID };
    }

    // Generate Images with new parameters
    const images = await createStableDiffusionImages({
      prompt,
      numberOfImages,
      model,
      stylePreset,
      width: formData.width,
      height: formData.height,
      negativePrompt: formData.negativePrompt,
      seed: formData.seed,
    });

    // Create a new set in our DB
    const set = await createNewSet({
      prompt,
      userId,
    });

    setId = set.id;
    const formattedImagesData = await Promise.all(
      images.artifacts.map(async (image) => {
        if (image.finishReason !== "ERROR") {
          // Store Image into DB with generation parameters
          const imageData = await createNewImage({
            prompt,
            userId,
            model,
            preset: stylePreset,
            isImagePrivate,
            setId,
            // Store generation parameters
            width: formData.width,
            height: formData.height,
            cfgScale: formData.cfgScale,
            steps: formData.steps,
            negativePrompt: formData.negativePrompt,
            seed: formData.seed,
          });
          Logger.info({
            message: `Successfully stored Image Data in DB: ${imageData.id}`,
            metadata: {
              imageDataId: imageData.id,
            },
          });

          // Store Image blob in S3
          await addBase64EncodedImageToAWS(image.base64, imageData.id);
          Logger.info({
            message: `Successfully stored S3 Data for Image ID: ${imageData.id}`,
            metadata: {
              imageDataId: imageData.id,
            },
          });

          const imageURL = getS3BucketURL(imageData.id);
          const thumbnailURL = getS3BucketThumbnailURL(imageData.id);

          const formattedImageData = {
            ...imageData,
            url: imageURL,
            thumbnailURL,
          };

          return formattedImageData;
        }
      })
    );

    // 'https://ai-icon-generator.s3.us-east-2.amazonaws.com/clgueu0pg0001r2fbyg3do2ra'
    return { images: formattedImagesData, setId };
  } catch (error) {
    Logger.error({
      message: "Error creating new Stable Diffusion images",
      error: error as Error,
    });
    // Delete the Set if error occurs and Set was created
    if (setId) {
      await deleteSet({ setId });
    }

    // Try to parse the error message if it's a JSON string
    let errorMessage = (error as Error).message;
    try {
      const parsedError = JSON.parse(errorMessage) as StabilityAIError;
      errorMessage = parsedError.message;
    } catch (error) {
      Logger.error({
        message: "Error parsing error message",
        error: error as Error,
      });
    }

    return {
      images: [],
      setId: "",
      error: errorMessage,
    };
  }
};
