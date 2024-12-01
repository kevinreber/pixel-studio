import {
  type LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { requireUserLogin } from "~/services";
import CreatePage from "~/pages/CreatePage";
import { createNewImages, updateUserCredits } from "~/server";
import { z } from "zod";
import { PageContainer, GeneralErrorBoundary } from "~/components";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Images" }];
};

const MODEL_OPTIONS = [
  {
    name: "Stable Diffusion 1.6",
    value: "stable-diffusion-v1-6",
    image: "/assets/model-thumbs/sd-1-5.jpg",
    description: "The most popular first-generation stable diffusion model.",
  },
  {
    name: "Stable Diffusion XL",
    value: "stable-diffusion-xl-1024-v1-0",
    image: "/assets/model-thumbs/sdxlv1.jpg",
    description: "The state-of-the-art in open-source image generation.",
  },
  {
    name: "DALL-E 3",
    value: "dall-e-3",
    image: "/assets/model-thumbs/dalle3.jpg",
    description: "State-of-the-art image generator from OpenAI's DALL-E 3.",
  },
  {
    name: "DALL-E 2",
    value: "dall-e-2",
    image: "/assets/model-thumbs/dalle2.jpg",
    description: "State-of-the-art image generator from OpenAI's DALL-E 2.",
  },
  // {
  //   name: "Dreamshaper XL Lightning",
  //   image: "/assets/model-thumbs/ds-xl-lightning.jpg",
  //   description: "Dreamshaper XL, accelerated. High quality, fast and cheap.",
  // },
  // {
  //   name: "Flux",
  //   image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
  //   description:
  //     "The largest open-source text-to-image model to date, by Black Forest Labs.",
  // },
  // {
  //   name: "Ideogram 2.0",
  //   image: "/assets/model-thumbs/ideogram-v1.jpg",
  //   description: "A model by Ideogram that is amazing at Typography.",
  // },
  // {
  //   name: "Google Imagen 3.0",
  //   image: "/assets/model-thumbs/imagen-3-0-thumb.jpg",
  //   description:
  //     "A model by Google DeepMind that is great at typography & prompt adherence.",
  // },
];

const STYLE_OPTIONS = [
  {
    name: "3d Model",
    value: "3d-model",
    image: "/assets/preset-text-styles/3d-game-v2.jpg",
  },
  {
    name: "Anime",
    value: "anime",
    image: "/assets/preset-text-styles/anime-v2.jpg",
  },
  {
    name: "Cinematic",
    value: "cinematic",
    image: "/assets/preset-text-styles/cinematic.jpg",
  },
  {
    name: "Comic Book",
    value: "comic-book",
    image: "/assets/preset-text-styles/modern-comic.jpg",
  },
  {
    name: "Digital Art",
    value: "digital-art",
    image: "/assets/preset-text-styles/artistic-portrait.jpg",
  },
  {
    name: "Fantasy Art",
    value: "fantasy-art",
    image: "/assets/preset-text-styles/fantasy.jpg",
  },
  {
    name: "Neon Punk",
    value: "neon-punk",
    image: "/assets/preset-text-styles/cyberpunk.jpg",
  },
  {
    name: "Origami",
    value: "origami",
    image: "/assets/preset-text-styles/epic-origami.jpg",
  },
  {
    name: "Photographic",
    value: "photographic",
    image: "/assets/preset-text-styles/photo.jpg",
  },
  {
    name: "None",
    value: "none",
    image: "",
  },
  // { name: "Isometric", image: "/assets/preset-text-styles/.jpg" },
  // { name: "Line Art", image: "/assets/preset-text-styles/.jpg" },
  // { name: "Low Poly", image: "/assets/preset-text-styles/.jpg" },
  // {
  //   name: "Modeling Compound",
  //   image: "/assets/preset-text-styles/.jpg",
  // },
  // { name: "Analog Film", image: "/assets/preset-text-styles/jpg" },
  // { name: "Pixel Art", image: "/assets/preset-text-styles/.jpg" },
  // {
  //   name: "Tile Texture",
  //   image: "/assets/preset-text-styles/.jpg",
  // },
];

const MAX_PROMPT_CHARACTERS = 3500;
const MIN_NUMBER_OF_IMAGES = 1;
const MAX_NUMBER_OF_IMAGES = 10;

const CreateImagesFormSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, { message: "Prompt can not be empty" })
    .max(MAX_PROMPT_CHARACTERS, {
      message: `Prompt must be ${MAX_PROMPT_CHARACTERS} characters or less`,
    }),
  stylePreset: z
    .string()
    .min(1)
    .optional()
    .refine(
      (value) => {
        if (!value || value === "none") return true;
        // Check if value is invalid
        return STYLE_OPTIONS.some((preset) => preset.value.includes(value));
      },
      {
        // overrides the error message here
        message: "Invalid preset selected",
      }
    ),
  model: z
    .string()
    .min(1, { message: "Language model can not be empty" })
    .refine(
      (value) =>
        // Check if value is invalid
        MODEL_OPTIONS.some((model) => model.value.includes(value)),
      {
        // overrides the error message here
        message: "Invalid language model selected",
      }
    ),
  numberOfImages: z
    .number()
    .min(MIN_NUMBER_OF_IMAGES, {
      message: `Number of images to generate must be ${MIN_NUMBER_OF_IMAGES}-${MAX_NUMBER_OF_IMAGES}`,
    })
    .max(MAX_NUMBER_OF_IMAGES, {
      message: `Number of images to generate must be ${MIN_NUMBER_OF_IMAGES}-${MAX_NUMBER_OF_IMAGES}`,
    }),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);

  return json({ modelOptions: MODEL_OPTIONS, styleOptions: STYLE_OPTIONS });
};

export type CreatePageLoader = typeof loader;
export type CreateImagesFormData = {
  prompt: string;
  numberOfImages: number;
  model: string;
  stylePreset?: string;
  private?: boolean;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const prompt = formData.get("prompt") || "";
  const model = formData.get("model") || "";
  let stylePreset = formData.get("style") || undefined;
  const numberOfImages = formData.get("numberOfImages") || "1";

  if (stylePreset === "none") {
    stylePreset = undefined;
  }

  const validateFormData = CreateImagesFormSchema.safeParse({
    prompt: prompt.toString(),
    numberOfImages: parseInt(numberOfImages.toString()),
    model: model.toString(),
    stylePreset,
  });

  if (!validateFormData.success) {
    return json(
      {
        message: "Error invalid form data",
        error: validateFormData.error.flatten(),
      },
      {
        status: 400,
      }
    );
  }

  // Verify user has enough credits
  try {
    await updateUserCredits(user.id, parseInt(numberOfImages.toString()));
  } catch (error: unknown) {
    console.error(error);

    return json(
      {
        message: "Error updating user credits",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }

  const response = await createNewImages(validateFormData.data, user.id);

  if (response.setId) {
    // delay to allow time for all images to be created
    await new Promise((resolve) => setTimeout(resolve, 300));
    return redirect(`/sets/${response.setId}`);
  }

  return json({ error: "Failed to create set" }, { status: 500 });
};

export default function Index() {
  return <CreatePage />;
}

export function ErrorBoundary() {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
