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

const IMAGE_HEIGHT = 1024;
const IMAGE_WIDTH = 1024;
const THREE_SECONDS_IN_MS = 1000 * 3;

const DEFAULT_NUMBER_OF_IMAGES_CREATED = 1;
const DEFAULT_AI_IMAGE_LANGUAGE_MODEL = "stable-diffusion-xl-1024-v1-0";
const DEFAULT_IMAGE_STYLE_PRESET = undefined;
const DEFAULT_IS_IMAGE_PRIVATE = false;

const DEFAULT_PAYLOAD = {
  prompt: "",
  numberOfImages: DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model: DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  stylePreset: DEFAULT_IMAGE_STYLE_PRESET,
  private: DEFAULT_IS_IMAGE_PRIVATE,
};

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

interface StabilityAIError {
  id: string;
  name: string;
  message: string;
}

/**
 * @description
 * This function makes a request to Stability AI's – Stable Diffusion API to fetch images generated using the prompt
 *
 * @reference
 * https://platform.stability.ai/docs/api-reference#tag/v1generation/operation/textToImage
 */
const createStableDiffusionImages = async ({
  prompt,
  numberOfImages = DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model = DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  stylePreset = DEFAULT_IMAGE_STYLE_PRESET,
  // New generation parameters
  width = IMAGE_WIDTH,
  height = IMAGE_HEIGHT,
  cfgScale = 7,
  steps = 40,
  negativePrompt,
}: {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  // New generation parameters
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  negativePrompt?: string;
}) => {
  Logger.info({
    message: `Attempting to generate ${numberOfImages} Stable Diffusion images with ${model} model and style preset: ${stylePreset}`,
    metadata: { width, height, cfgScale, steps, hasNegativePrompt: !!negativePrompt },
  });

  const promptMessage = prompt;
  const numberOfImagesToGenerate = Math.round(numberOfImages);
  const engineId = model;

  // Build text_prompts array with optional negative prompt
  const textPrompts: Array<{ text: string; weight: number }> = [
    {
      text: promptMessage,
      weight: 1,
    },
  ];

  // Add negative prompt if provided (with negative weight)
  if (negativePrompt && negativePrompt.trim()) {
    textPrompts.push({
      text: negativePrompt,
      weight: -1,
    });
  }

  const body = {
    /**
     * `cfg_scale` is how strictly the diffusion process adheres to the prompt text.
     * The higher values keep your image closer to your prompt (Ex: 1-35)
     */
    cfg_scale: cfgScale,
    height: height,
    width: width,
    steps: steps,
    style_preset: stylePreset,
    samples: numberOfImagesToGenerate,
    text_prompts: textPrompts,
  };

  try {
    const response = await fetch(
      `${process.env.STABLE_DIFFUSION_API_ENDPOINT}/v1/generation/${engineId}/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.STABLE_DIFFUSION_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorDataText = await response.text();
      Logger.error({
        message: "Stability AI Error",
        metadata: {
          errorDataText,
        },
      });

      // Parse the error response
      try {
        const errorData = JSON.parse(errorDataText) as StabilityAIError;
        throw new Error(errorData.message);
      } catch {
        // If we can't parse the error JSON, throw the raw text
        throw new Error(errorDataText);
      }
    }

    const responseJSON = (await response.json()) as GenerationResponse;
    Logger.info({
      message: "Successful response",
      metadata: {
        responseJSON,
      },
    });

    return responseJSON;
  } catch (error) {
    Logger.error({
      message: "Error creating image using language model",
      error: error as Error,
    });
    // Just throw the error message directly
    throw error;
  }
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
      // New generation parameters
      width: formData.width,
      height: formData.height,
      cfgScale: formData.cfgScale,
      steps: formData.steps,
      negativePrompt: formData.negativePrompt,
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
