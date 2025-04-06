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

export const MODEL_OPTIONS = [
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
    name: "Flux Schnell",
    value: "flux-pro",
    // value: "black-forest-labs/FLUX.1-schnell",
    image: "/assets/model-thumbs/flux-schnell.jpg",
    description:
      "Fastest open-source text-to-image model to date, by Black Forest Labs.",
  },
  {
    name: "Flux Pro 1.1",
    value: "flux-pro-1.1",
    // value: "black-forest-labs/FLUX.1-schnell",
    image: "/assets/model-thumbs/flux-pro-1-1.jpg",
    description:
      "Professional grade image generation with excellent prompt following and visual quality, by Black Forest Labs.",
  },
  {
    name: "Flux Dev",
    value: "flux-dev",
    // value: "black-forest-labs/FLUX.1-dev",
    image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
    description:
      "Development version offering cost-effective image generation while maintaining good quality, by Black Forest Labs.",
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
  // ! TODO: RunDiffusion/Juggernaut-XL-v9 is not accessible off Hugging Face for some reason
  // {
  //   name: "Juggernaut XL v9",
  //   value: "RunDiffusion/Juggernaut-XL-v9",
  //   image: "/assets/model-thumbs/juggernaut-v9-rundiffusion-lightning.jpg",
  //   description:
  //     "A model by RunDiffusion that is great at creating endless images.",
  // },
  // {
  //   name: "NeverEnding Dream",
  //   value: "Lykon/NeverEnding-Dream",
  //   image: "/assets/model-thumbs/neverending-dream-1-2-2.jpg",
  //   description: "A model by Lykon that is great at creating endless images.",
  // },
  // {
  //   name: "Dreamshaper XL Lightning",
  //   image: "/assets/model-thumbs/ds-xl-lightning.jpg",
  //   description: "Dreamshaper XL, accelerated. High quality, fast and cheap.",
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
] as const;

export const STYLE_OPTIONS = [
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
] as const;

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

export type CreatePageActionData = typeof action;

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
        success: false,
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
        success: false,
        message: "Error updating user credits",
        error:
          error instanceof Error
            ? error.message
            : "Not enough credits available",
      },
      { status: 500 }
    );
  }

  try {
    const result = await createNewImages(validateFormData.data, user.id);

    // If there's an error from Stability AI, show it in the toast
    if (result.error) {
      return json({
        success: false,
        message: "Image generation failed",
        error: result.error,
        images: [],
        setId: "",
      });
    }

    // If we have a setId, redirect to the set page after a small delay
    if (result.setId) {
      // delay to allow time for all images to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return redirect(`/sets/${result.setId}`);
    }

    // Fallback response if no setId but also no error
    return json({
      success: true,
      images: result.images,
      setId: result.setId,
    });
  } catch (error) {
    console.error(`Error creating new images: ${error}`);
    return json(
      {
        success: false,
        message: "Failed to create images",
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
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
