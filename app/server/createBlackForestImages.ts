import { invariantResponse } from "~/utils";
import {
  createNewImage,
  FormattedImageData,
  getFormattedImageData,
} from "./createNewImage";
import { addBase64EncodedImageToAWS } from "./addBase64EncodedImageToAWS";
import { createNewSet } from "./createNewSet";
import { deleteSet } from "./deleteSet";
import { delay } from "~/utils/delay";
import { convertImageUrlToBase64 } from "~/utils/convertImageUrlToBase64";
import { Logger } from "~/utils/logger.server";
import { CreateImagesFormData } from "~/routes/create";

type BlackForestResponse = {
  id: string;
  status: string;
  result?: {
    sample: string;
  };
};

const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const MAX_POLLING_ATTEMPTS = 60;
const POLLING_INTERVAL = 500; // ms

/**
 * Create an image using Black Forest Labs API
 * @param formData - The form data payload
 * @returns The ID of the request
 *
 * @docs https://docs.bfl.ml/
 *
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
  const response = await fetch(
    `${process.env.BLACK_FOREST_LABS_API_URL}/v1/${formData.model}`,
    {
      method: "POST",
      headers: {
        "x-key": process.env.BLACK_FOREST_LABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: formData.prompt,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      }),
    }
  );

  invariantResponse(
    response.ok,
    `Failed to generate image from Black Forest Labs: ${response.statusText}`
  );

  const responseData = await response.json();
  return responseData.id;
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

  invariantResponse(
    resultResponse.ok,
    `Failed to get result from Black Forest Labs: ${resultResponse.statusText}`
  );

  return resultResponse.json();
};

// Update the pollForBlackForestImageResult function
const pollForBlackForestImageResult = async (
  requestId: string
): Promise<string> => {
  Logger.info({
    message: `[createBlackForestImages.ts]: Polling for result from Black Forest Labs: ${requestId}`,
    metadata: { requestId },
  });
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    Logger.info({
      message: `[createBlackForestImages.ts]: Polling attempt #${
        attempts + 1
      } for result from Black Forest Labs: ${requestId}`,
      metadata: { requestId },
    });
    const resultData = await getBlackForestImageStatus(requestId);
    Logger.info({
      message: `[createBlackForestImages.ts]: Get Black Forest Image result for requestId: ${requestId}`,
      metadata: { requestId, resultData },
    });

    if (resultData.status === "Ready" && resultData.result) {
      Logger.info({
        message: `[createBlackForestImages.ts]: Converting image URL to base64 for requestId: ${requestId}`,
        metadata: { requestId },
      });
      // Convert the image URL to base64
      const base64Image = await convertImageUrlToBase64(
        resultData.result.sample
      );
      return base64Image;
    } else if (resultData.status === "Failed") {
      Logger.error({
        message: `[createBlackForestImages.ts]: Image generation failed for requestId: ${requestId}`,
        metadata: { requestId, resultData },
      });
      throw new Error("Image generation failed");
    }

    await delay(POLLING_INTERVAL);
    attempts++;
  }

  throw new Error("Timeout waiting for image generation");
};

export const createBlackForestImages = async (
  formData: CreateImagesFormData,
  userId: string
) => {
  Logger.info({
    message: `[createBlackForestImages.ts]: Creating images using Black Forest Labs model: ${formData.model}`,
    metadata: { formData },
  });
  let setId = "";
  const formattedImages: FormattedImageData[] = [];
  try {
    // Step 1: Create a new set
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });

    setId = set.id;

    for (let i = 0; i < formData.numberOfImages; i++) {
      // Step 2: Submit the generation request
      const requestId = await createBlackForestImage(formData);
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully stored Black Forest Image data #${
          i + 1
        } for requestId: ${requestId}`,
      });

      // Step 3: Poll for results and get base64 image
      const base64Image = await pollForBlackForestImageResult(requestId);

      // Step 4: Create a new image in DB
      const imageData = await createNewImage({
        prompt: formData.prompt,
        userId,
        model: formData.model,
        preset: undefined,
        isImagePrivate: false,
        setId,
      });
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully stored Black Forest Image Data in DB: ${imageData.id}`,
      });

      // Step 5: Upload to S3
      await addBase64EncodedImageToAWS(base64Image, imageData.id);
      Logger.info({
        message: `[createBlackForestImages.ts]: Successfully stored Black Forest Image data #${
          i + 1
        } in S3: ${imageData.id}`,
      });

      // Step 6: Format image data
      const formattedImageData = getFormattedImageData(imageData);
      formattedImages.push(formattedImageData);
    }

    return { images: formattedImages, setId };
  } catch (error) {
    Logger.error({
      message: `[createBlackForestImages.ts]: Error generating image from Black Forest Labs`,
      metadata: { error },
    });
    if (setId) {
      await deleteSet({ setId });
    }
    return { images: [], setId: "" };
  }
};
