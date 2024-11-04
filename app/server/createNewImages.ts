import {
  createNewStableDiffusionImages,
  // addBase64EncodedImageToAWS,
  // addNewImageToDB,
  createNewDallEImages,
} from "~/server";
import { invariantResponse } from "~/utils/invariantResponse";

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

/**
 * @description
 * This function determines which AI Image language model the user wants to use
 */
export const createNewImages = async (
  formData: FormDataPayload = DEFAULT_PAYLOAD,
  userId: string
) => {
  const AILanguageModelToUse = formData.model;

  invariantResponse(AILanguageModelToUse, "Must select a language model");

  try {
    if (AILanguageModelToUse === "dall-e") {
      const data = await createNewDallEImages(formData, userId);

      return data;
    }

    if (AILanguageModelToUse.includes("stable-diffusion")) {
      const data = await createNewStableDiffusionImages(formData, userId);

      return data;
    }
    return { images: [] };
  } catch (error) {
    console.error(error);

    return { images: [] };
  }
};
