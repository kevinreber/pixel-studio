import { setTimeout } from "timers/promises";
import {
  addBase64EncodedImageToAWS,
  createNewImage,
  deleteSet,
} from "~/server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils";
import { createNewSet } from "./createNewSet";

const MOCK_IMAGE_ID = "stable-diffusion-xl-futuristic-bonsai-tree";

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

type FormDataPayload = {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
};

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
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
}: {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
}) => {
  console.log(
    `Attempting to generate Stable Diffusion images with ${model} model and style preset: ${stylePreset}`
  );

  const promptMessage = prompt;
  const numberOfImagesToGenerate = Math.round(numberOfImages);
  const engineId = model;

  const body = {
    /**
     * `cfg_scale` is how strictly the diffusion process adheres to the prompt text.
     * The higher values keep your image closer to your prompt (Ex: 1-35)
     */
    cfg_scale: 7,
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    steps: 40,
    style_preset: stylePreset,
    samples: numberOfImagesToGenerate,
    text_prompts: [
      {
        text: promptMessage,
        weight: 1,
      },
    ],
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
      const errorData = await response.json();
      console.error("Stability AI Error:", errorData);
      throw new Error(
        `API Error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const responseJSON = (await response.json()) as GenerationResponse;
    console.log("Successful response:", responseJSON);

    return responseJSON;
  } catch (error) {
    console.error(error);
    throw new Error(`Error creating image using language model: ${model}`);
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
  formData: FormDataPayload = DEFAULT_PAYLOAD,
  userId: string
) => {
  console.log("Creating new Stable Diffusion images...");
  const {
    prompt,
    numberOfImages,
    model,
    stylePreset,
    private: isImagePrivate = false,
  } = formData;
  let setId = "";
  try {
    if (process.env.USE_MOCK_DALLE === "true") {
      const mockData = getStableDiffusionMockDataResponse(numberOfImages);
      await setTimeout(THREE_SECONDS_IN_MS);

      return { images: mockData };
    }

    // Generate Images
    const images = await createStableDiffusionImages({
      prompt,
      numberOfImages,
      model,
      stylePreset,
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
          // Store Image into DB
          const imageData = await createNewImage({
            prompt,
            userId,
            model,
            preset: stylePreset,
            isImagePrivate,
            setId,
          });
          console.log(`Successfully stored Image Data in DB: ${imageData.id}`);

          // Store Image blob in S3
          await addBase64EncodedImageToAWS(image.base64, imageData.id);
          console.log(
            `Successfully stored S3 Data for Image ID: ${imageData.id}`
          );

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
    return { images: formattedImagesData };
  } catch (error) {
    console.error(error);
    // Delete the Set if error occurs and Set was created
    if (setId) {
      await deleteSet({ setId });
    }

    return { images: [] };
  }
};
