import { setTimeout } from "timers/promises";
import {
  addBase64EncodedImageToAWS,
  createNewImage,
  createNewSet,
  deleteSet,
} from "~/server";
import { getS3BucketURL, getS3BucketThumbnailURL } from "~/utils";
import OpenAI from "openai";

const DALL_E_MODEL = "dall-e";
const DALL_E_2_MODEL = "all-e-2";
const MOCK_IMAGE_ID = "cliid9qad0001r2q9pscacuj0";
const MOCK_SET_ID = "cm32igx0l0011gbosfbtw33ai";

export const getDallEMockDataResponse = (numberOfImages = 1) => {
  console.log("⚠️ Warning – Using DALL-E Mock Data *************************");
  const imageURL = getS3BucketURL(MOCK_IMAGE_ID);
  const thumbnailURL = getS3BucketThumbnailURL(MOCK_IMAGE_ID);

  const mockDallEImage = {
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
  const mockData = new Array(numberOfImages).fill(mockDallEImage);

  return mockData;
};

// Move OpenAI client initialization into a function
const getOpenAIClient = () => {
  if (!process.env.DALLE_API_KEY) {
    throw new Error(
      "DALLE_API_KEY environment variable is required for non-mock usage"
    );
  }
  return new OpenAI({
    apiKey: process.env.DALLE_API_KEY,
  });
};

const DEFAULT_NUMBER_OF_IMAGES_CREATED = 1;
const IMAGE_SIZE = "1024x1024";
const DEFAULT_AI_IMAGE_LANGUAGE_MODEL = DALL_E_MODEL;
const DEFAULT_IS_IMAGE_PRIVATE = false;

const THREE_SECONDS_IN_MS = 1000 * 3;
const BASE_64_FORMAT = "b64_json";
const DEFAULT_PAYLOAD = {
  prompt: "",
  numberOfImages: DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model: DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  private: DEFAULT_IS_IMAGE_PRIVATE,
};

type FormDataPayload = {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
};

/**
 * @description
 * This function makes a request to Open AI's Dall-E API to fetch images generated using the prompt
 */
const createDallEImages = async (
  prompt: string,
  numberOfImages = DEFAULT_NUMBER_OF_IMAGES_CREATED
) => {
  console.log("Creating DALL-E images...");
  const promptMessage = prompt;
  const numberOfImagesToGenerate = Math.round(numberOfImages);

  try {
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: DALL_E_2_MODEL,
      prompt: promptMessage,
      n: numberOfImagesToGenerate,
      size: IMAGE_SIZE,
      response_format: BASE_64_FORMAT,
    });

    const base64EncodedImages = response.data.map((result) => result.b64_json);

    console.log("Successfully created DALL-E images");
    return base64EncodedImages;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * @description
 * This function does the following in the listed order:
 *   1. Gets an image from OpenAI's Dall-E API
 *   2. Creates a new Image in our DB using the data returned from "Step 1"
 *   3. Stores the image Blob from "Step 1" into our AWS S3 bucket
 */
export const createNewDallEImages = async (
  formData: FormDataPayload = DEFAULT_PAYLOAD,
  userId: string
) => {
  console.log("Creating new DALL-E images...");
  const { prompt, numberOfImages, private: isImagePrivate = false } = formData;
  const model = DALL_E_MODEL;

  if (!userId) {
    throw new Error("User ID is required");
  }
  let setId = "";
  try {
    if (process.env.USE_MOCK_DALLE === "true") {
      const mockData = getDallEMockDataResponse(numberOfImages);
      await setTimeout(THREE_SECONDS_IN_MS);

      return { images: mockData, setId: MOCK_SET_ID };
    }

    // Generate Images
    const imagesImages = await createDallEImages(prompt, numberOfImages);

    // Create a new set
    const set = await createNewSet({
      prompt,
      userId,
    });
    setId = set.id;

    const formattedImagesData = await Promise.all(
      imagesImages.map(async (imageImage) => {
        // Store Image into DB
        const imageData = await createNewImage({
          prompt,
          userId,
          model,
          preset: "",
          isImagePrivate,
          setId,
        });
        console.log(`Successfully stored Image Data in DB: ${imageData.id}`);

        // Store Image blob in S3
        await addBase64EncodedImageToAWS(imageImage as string, imageData.id);
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
      })
    );

    // 'https://ai-icon-generator.s3.us-east-2.amazonaws.com/clgueu0pg0001r2fbyg3do2ra'
    return { images: formattedImagesData, setId };
  } catch (error) {
    console.error(error);
    // Delete the Set if error occurs and Set was created
    if (setId) {
      await deleteSet({ setId });
    }

    return { images: [], setId: "" };
  }
};
