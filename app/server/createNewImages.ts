import { CreateImagesFormData } from "~/routes/create";
import {
  createNewStableDiffusionImages,
  createNewDallEImages,
  deleteSet,
  createHuggingFaceImages,
  createBlackForestImages,
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

const VALID_HUGGING_FACE_MODELS = [
  "Lykon/NeverEnding-Dream",
  "black-forest-labs/FLUX.1-dev",
  "black-forest-labs/FLUX.1-schnell",
  "RunDiffusion/Juggernaut-XL-v9",
];

const VALID_BLACK_FOREST_LABS_MODELS = ["flux-pro-1.1", "flux-pro", "flux-dev"];

const isValidHuggingFaceModel = (model: string) => {
  return VALID_HUGGING_FACE_MODELS.includes(model);
};

const isValidBlackForestLabsModel = (model: string) => {
  return VALID_BLACK_FOREST_LABS_MODELS.includes(model);
};

/**
 * @description
 * This function determines which AI Image language model the user wants to use
 */
export const createNewImages = async (
  formData: CreateImagesFormData = DEFAULT_PAYLOAD,
  userId: string
) => {
  const AILanguageModelToUse = formData.model;

  invariantResponse(AILanguageModelToUse, "Must select a language model");
  invariantResponse(formData.prompt, "Must provide a prompt");

  let setId = "";

  try {
    // handle DALL-E models
    if (AILanguageModelToUse.includes("dall-e")) {
      const data = await createNewDallEImages(formData, userId);

      setId = data.setId || "";

      return data;
    } else if (AILanguageModelToUse.includes("stable-diffusion")) {
      const data = await createNewStableDiffusionImages(formData, userId);

      setId = data.setId || "";

      return data;
    } else if (isValidBlackForestLabsModel(AILanguageModelToUse)) {
      const data = await createBlackForestImages(formData, userId);

      setId = data.setId || "";
      return data;
    } else if (isValidHuggingFaceModel(AILanguageModelToUse)) {
      const data = await createHuggingFaceImages(formData, userId);

      setId = data.setId || "";
      return data;
    }

    throw new Error("Invalid model");
  } catch (error) {
    console.error(error);
    if (setId) {
      await deleteSet({ setId });
    }

    throw new Error(`Failed to create images: ${error}`);
  }
};
