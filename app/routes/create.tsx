import {
  type LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { requireUserLogin } from "~/services";
import CreatePage from "~/pages/CreatePage";
import {
  createNewImages,
  updateUserCredits,
  checkUserCredits,
} from "~/server";
import { getImageGenerationProducer } from "~/services/imageGenerationProducer.server";
import { z } from "zod";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { cacheDelete } from "~/utils/cache.server";
import { getModelCreditCost } from "~/config/pricing";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Images" }];
};

export const MODEL_OPTIONS = [
  {
    name: "Stable Diffusion 1.6",
    value: "stable-diffusion-v1-6",
    image: "/assets/model-thumbs/sd-1-5.jpg",
    description: "The most popular first-generation stable diffusion model.",
    company: "Stability AI",
    supportsStyles: true,
    creditCost: 1,
  },
  {
    name: "Stable Diffusion XL",
    value: "stable-diffusion-xl-1024-v1-0",
    image: "/assets/model-thumbs/sdxlv1.jpg",
    description: "The state-of-the-art in open-source image generation.",
    company: "Stability AI",
    supportsStyles: true,
    creditCost: 2,
  },
  {
    name: "Flux Schnell",
    value: "flux-pro",
    image: "/assets/model-thumbs/flux-schnell.jpg",
    description:
      "Fastest open-source text-to-image model to date, by Black Forest Labs.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Flux Pro 1.1",
    value: "flux-pro-1.1",
    image: "/assets/model-thumbs/flux-pro-1-1.jpg",
    description:
      "Professional grade image generation with excellent prompt following and visual quality.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 4,
  },
  {
    name: "Flux Dev",
    value: "flux-dev",
    image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
    description:
      "Development version offering cost-effective image generation while maintaining good quality.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "DALL-E 3",
    value: "dall-e-3",
    image: "/assets/model-thumbs/dalle3.jpg",
    description: "State-of-the-art image generator from OpenAI.",
    company: "OpenAI",
    supportsStyles: false,
    creditCost: 6,
  },
  {
    name: "DALL-E 2",
    value: "dall-e-2",
    image: "/assets/model-thumbs/dalle2.jpg",
    description: "Reliable image generator from OpenAI.",
    company: "OpenAI",
    supportsStyles: false,
    creditCost: 1,
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

  // Calculate total credit cost based on model and number of images
  const modelValue = validateFormData.data.model;
  const creditCostPerImage = getModelCreditCost(modelValue);
  const totalCreditCost =
    creditCostPerImage * validateFormData.data.numberOfImages;

  // Check if user has enough credits (without deducting yet)
  try {
    await checkUserCredits(user.id, totalCreditCost);
  } catch (error: unknown) {
    console.error(error);

    return json(
      {
        success: false,
        message: "Insufficient credits",
        error:
          error instanceof Error
            ? error.message
            : `Not enough credits. This generation requires ${totalCreditCost} credits.`,
      },
      { status: 400 }
    );
  }

  // Check if Kafka-based async generation is enabled
  // Only allow Kafka in development - not ready for production yet
  const isProduction = process.env.NODE_ENV === "production";
  const isKafkaEnabled =
    !isProduction && process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true";

  if (isKafkaEnabled) {
    try {
      // 🚀 Kafka: Use async generation
      console.log("Using Kafka for async image generation...");

      const producer = await getImageGenerationProducer();

      // Health check - verify Kafka is available
      const isKafkaHealthy = await producer.healthCheck();
      if (!isKafkaHealthy) {
        throw new Error("Image generation service is temporarily unavailable");
      }

      // For Kafka, we charge upfront since it's async
      // The consumer should handle refunds on failure
      await updateUserCredits(user.id, totalCreditCost);

      // Clear cache for user
      const cacheKey = `user-login:${user.id}`;
      await cacheDelete(cacheKey);
      const setsCacheKey = `sets:user:${user.id}:undefined:undefined`;
      await cacheDelete(setsCacheKey);

      // Queue the image generation request (returns immediately!)
      const response = await producer.queueImageGeneration(
        validateFormData.data,
        user.id
      );

      console.log(
        `Successfully queued image generation request: ${response.requestId}`
      );

      // Redirect immediately to processing page with real-time updates
      return redirect(response.processingUrl);
    } catch (error) {
      console.error(
        "Kafka image generation failed, falling back to synchronous:",
        error
      );
      // Fall through to synchronous generation below
    }
  }

  // 🔄 Synchronous generation (used when Kafka is disabled or fails)
  console.log("Using synchronous image generation...");

  try {
    const result = await createNewImages(validateFormData.data, user.id);

    // If there's an error from any AI provider, don't charge
    if ("error" in result) {
      return json({
        success: false,
        message: "Image generation failed",
        error: result.error,
        images: [],
        setId: "",
      });
    }

    // Validate that we have both images and a setId
    if (!result.setId || !result.images?.length) {
      throw new Error("Failed to create images - incomplete response");
    }

    // SUCCESS! Now charge the user credits
    try {
      await updateUserCredits(user.id, totalCreditCost);
      // Clear cache for user
      const cacheKey = `user-login:${user.id}`;
      await cacheDelete(cacheKey);
      const setsCacheKey = `sets:user:${user.id}:undefined:undefined`;
      await cacheDelete(setsCacheKey);
    } catch (creditError) {
      // If credit deduction fails after successful generation, log it but don't fail the request
      console.error("Failed to deduct credits after successful generation:", creditError);
    }

    // Redirect to the set page
    return redirect(`/sets/${result.setId}`);
  } catch (error) {
    console.error(`Error creating new images: ${error}`);

    return json(
      {
        success: false,
        message: "Failed to create images",
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
};

// Add type for action data
export type ActionData = {
  success: boolean;
  message?: string;
  error?: string | { [key: string]: string[] };
  images?: { id: string; url: string }[];
  setId?: string;
};

export type CreatePageActionData = typeof action;

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
