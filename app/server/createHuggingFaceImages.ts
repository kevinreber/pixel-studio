import { HfInference } from "@huggingface/inference";
import { createNewSet } from "./createNewSet";
import { addBase64EncodedImageToAWS } from "./addBase64EncodedImageToAWS";
import {
  createNewImage,
  FormattedImageData,
  getFormattedImageData,
} from "./createNewImage";
import { deleteSet } from "./deleteSet";
import { Logger } from "~/utils/logger.server";

type FormDataPayload = {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
};

const getHuggingFaceClient = () => {
  if (!process.env.HUGGING_FACE_API_TOKEN) {
    throw new Error("HUGGING_FACE_API_TOKEN is required");
  }
  return new HfInference(process.env.HUGGING_FACE_API_TOKEN);
};

const createHuggingFaceImage = async (
  hf: HfInference,
  formData: FormDataPayload
) => {
  try {
    const response = await hf.textToImage({
      model: formData.model,
      inputs: formData.prompt,
    });

    // Convert the image blob to a base64 string or save to storage
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    Logger.error({
      message: `[createHuggingFaceImages.ts]: Error creating image using Hugging Face:`,
      metadata: { error },
    });
    throw error;
  }
};

export const createHuggingFaceImages = async (
  formData: FormDataPayload,
  userId: string
) => {
  Logger.info({
    message: `[createHuggingFaceImages.ts]: Creating ${formData.numberOfImages} images using Hugging Face: ${formData.model}`,
  });
  const formattedImagesData: FormattedImageData[] = [];
  let setId = "";

  try {
    const hf = getHuggingFaceClient();
    const set = await createNewSet({
      prompt: formData.prompt,
      userId,
    });

    setId = set.id;

    for (let i = 0; i < formData.numberOfImages; i++) {
      const imageData = await createNewImage({
        prompt: formData.prompt,
        userId,
        model: formData.model,
        preset: undefined,
        isImagePrivate: false,
        setId,
      });
      Logger.info({
        message: `[createHuggingFaceImages.ts]: Successfully stored Hugging Face Image Data #${
          i + 1
        } in DB: ${imageData.id}`,
      });

      // Store Image blob in S3
      const base64 = await createHuggingFaceImage(hf, formData);
      await addBase64EncodedImageToAWS(base64, imageData.id);
      Logger.info({
        message: `[createHuggingFaceImages.ts]: Successfully stored Hugging Face Image Data #${
          i + 1
        } in S3: ${imageData.id}`,
      });

      const formattedImageData = getFormattedImageData(imageData);

      formattedImagesData.push(formattedImageData);
    }

    return { images: formattedImagesData, setId };
  } catch (error) {
    Logger.error({
      message: `[createHuggingFaceImages.ts]: Error creating images using Hugging Face`,
      metadata: { error },
    });
    if (setId) {
      await deleteSet({ setId });
    }

    return { images: [], setId: "" };
  }
};
