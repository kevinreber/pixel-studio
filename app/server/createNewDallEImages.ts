import { setTimeout } from "timers/promises";
import {
  addBase64EncodedImageToAWS,
  createNewImage,
  createNewSet,
  deleteSet,
} from "~/server";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";
import OpenAI from "openai";
import { CreateImagesFormData } from "~/routes/create";
import { Logger } from "~/utils/logger.server";

const DALL_E_2_MODEL = "dall-e-2";
const DALL_E_3_MODEL = "dall-e-3";
const MOCK_IMAGE_ID = "cliid9qad0001r2q9pscacuj0";
const MOCK_SET_ID = "cm32igx0l0011gbosfbtw33ai";

export const getDallEMockDataResponse = (numberOfImages = 1) => {
  Logger.warn({
    message: "⚠️ Warning – Using DALL-E Mock Data *************************",
  });
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

const ONE_IMAGE_AT_A_TIME = 1;
const DEFAULT_NUMBER_OF_IMAGES_CREATED = 1;
const DEFAULT_IMAGE_SIZE = "1024x1024";
const DEFAULT_AI_IMAGE_LANGUAGE_MODEL = DALL_E_2_MODEL;
const DEFAULT_IS_IMAGE_PRIVATE = false;

const THREE_SECONDS_IN_MS = 1000 * 3;
const DEFAULT_PAYLOAD = {
  prompt: "",
  numberOfImages: DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model: DEFAULT_AI_IMAGE_LANGUAGE_MODEL,
  private: DEFAULT_IS_IMAGE_PRIVATE,
};

// Valid size options per model. Kept for input validation only — generation
// is now always routed through gpt-image-1 via mapSizeToGptImage1.
const VALID_SIZES = {
  "dall-e-3": ["1024x1024", "1792x1024", "1024x1792"],
  "dall-e-2": ["256x256", "512x512", "1024x1024"],
};

/**
 * @description
 * This function makes a request to Open AI's Dall-E API to fetch images generated using the prompt
 */
const createDallEImages = async (
  prompt: string,
  numberOfImages = DEFAULT_NUMBER_OF_IMAGES_CREATED,
  model: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string;
    generationStyle?: string;
  }
) => {
  Logger.info({
    message: "Creating DALL-E images...",
    metadata: {
      prompt,
      numberOfImages,
      model,
      options,
    },
  });
  const numberOfImagesToGenerate = Math.round(numberOfImages);
  const base64EncodedImages: (string | undefined)[] = [];

  // Determine size string from width/height or use default
  let sizeStr = DEFAULT_IMAGE_SIZE;
  if (options?.width && options?.height) {
    const requestedSize = `${options.width}x${options.height}`;
    const validSizes = VALID_SIZES[model as keyof typeof VALID_SIZES] || VALID_SIZES["dall-e-2"];
    if (validSizes.includes(requestedSize)) {
      sizeStr = requestedSize;
    }
  }

  // OpenAI deprecated `dall-e-2` and `dall-e-3` and migrated projects to
  // `gpt-image-1`. The picker still exposes the `dall-e-3` value (and legacy
  // records reference `dall-e-2`) — we keep accepting those model strings so
  // DB records and pricing config stay consistent, but every request is now
  // routed to `gpt-image-1`. The earlier layered fallback (try dall-e → retry
  // without optional params → fall through to gpt-image-1) is removed because
  // only the final layer was succeeding in prod.

  // gpt-image-1 supports 1024x1024 / 1024x1536 / 1536x1024 / auto. We map the
  // dall-e-3 portrait/landscape sizes to their closest equivalents and let
  // anything else (e.g. dall-e-2's 256/512) fall through to "auto".
  function mapSizeToGptImage1(
    size: string,
  ): "1024x1024" | "1024x1536" | "1536x1024" | "auto" {
    if (size === "1024x1792") return "1024x1536";
    if (size === "1792x1024") return "1536x1024";
    if (size === "1024x1024") return "1024x1024";
    return "auto";
  }

  // gpt-image-1 returns `b64_json` directly today, but the SDK type still
  // allows a `url`-only response. Normalize either shape to base64 so the
  // rest of the pipeline (S3 upload) doesn't care which one came back.
  async function urlToBase64(url: string): Promise<string | undefined> {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        Logger.error({
          message: `Failed to fetch image url: ${res.status}`,
          metadata: { url },
        });
        return undefined;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.toString("base64");
    } catch (err) {
      Logger.error({
        message: "Failed to download image url",
        error: err instanceof Error ? err : new Error(String(err)),
        metadata: { url },
      });
      return undefined;
    }
  }

  try {
    const openai = getOpenAIClient();
    const gptImage1Size = mapSizeToGptImage1(sizeStr);
    Logger.info({
      message: `Generating ${numberOfImagesToGenerate} image(s) via gpt-image-1 (requested model: ${model})`,
      metadata: {
        numberOfImagesToGenerate,
        requestedModel: model,
        requestedSize: sizeStr,
        gptImage1Size,
      },
    });

    // dall-e-3 historically generated one image per request; preserve that
    // serial loop for the dall-e-3 alias to keep behavior unchanged. dall-e-2
    // (and anything else) batches via `n`.
    if (model === DALL_E_3_MODEL) {
      for (let i = 0; i < numberOfImagesToGenerate; i++) {
        const response = await openai.images.generate({
          prompt,
          model: "gpt-image-1",
          size: gptImage1Size,
          n: ONE_IMAGE_AT_A_TIME,
        });
        const item = response.data?.[0];
        const encodedImage =
          item?.b64_json ?? (item?.url ? await urlToBase64(item.url) : undefined);
        if (encodedImage) {
          base64EncodedImages.push(encodedImage);
        }
      }
    } else {
      const response = await openai.images.generate({
        prompt,
        model: "gpt-image-1",
        size: gptImage1Size,
        n: numberOfImagesToGenerate,
      });
      const allEncodedImages = await Promise.all(
        (response.data ?? []).map(async (result) =>
          result.b64_json ?? (result.url ? await urlToBase64(result.url) : undefined),
        ),
      );
      base64EncodedImages.push(...allEncodedImages);
    }

    Logger.info({
      message: `Successfully created ${base64EncodedImages.length} image(s) via gpt-image-1`,
      metadata: {
        base64EncodedImagesLength: base64EncodedImages.length,
        requestedModel: model,
      },
    });
    return base64EncodedImages;
  } catch (error) {
    Logger.error({
      message: "Error creating gpt-image-1 images",
      error: error as Error,
    });
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
  formData: CreateImagesFormData = DEFAULT_PAYLOAD,
  userId: string
) => {
  console.log("Creating new DALL-E images...");
  const { prompt, numberOfImages, private: isImagePrivate = false } = formData;
  const model = formData.model;

  if (!userId) {
    throw new Error("User ID is required");
  }
  let setId = "";
  try {
    if (process.env.USE_MOCK_DALLE === "tru") {
      const mockData = getDallEMockDataResponse(numberOfImages);
      await setTimeout(THREE_SECONDS_IN_MS);

      return { images: mockData, setId: MOCK_SET_ID };
    }

    // Generate Images with new options
    const imagesImages = await createDallEImages(prompt, numberOfImages, model, {
      width: formData.width,
      height: formData.height,
      quality: formData.quality,
      generationStyle: formData.generationStyle,
    });

    // Create a new set
    const set = await createNewSet({
      prompt,
      userId,
    });
    setId = set.id;

    const formattedImagesData = await Promise.all(
      imagesImages.map(async (imageImage) => {
        // Store Image into DB with generation parameters
        const imageData = await createNewImage({
          prompt,
          userId,
          model,
          preset: "",
          isImagePrivate,
          setId,
          // Pass generation parameters for storage
          width: formData.width,
          height: formData.height,
          quality: formData.quality,
          generationStyle: formData.generationStyle,
          seed: formData.seed,
          // Remix fields
          isRemix: formData.isRemix,
          parentImageId: formData.parentImageId,
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
    Logger.error({
      message: "Error creating new DALL-E images",
      error: error as Error,
    });

    // Handle OpenAI specific errors
    if (error instanceof Error && "code" in error) {
      const openAIError = error as { code: string; message: string };
      if (openAIError.code === "billing_hard_limit_reached") {
        throw new Error(
          "OpenAI billing limit reached. Please try again later."
        );
      }
    }

    // Delete the Set if error occurs and Set was created
    if (setId) {
      await deleteSet({ setId });
    }

    return { images: [], setId: "" };
  }
};
