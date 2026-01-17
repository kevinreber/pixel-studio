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
    name: "Flux Pro",
    value: "flux-pro",
    image: "/assets/model-thumbs/flux-pro.jpg",
    description:
      "High-quality image generation by Black Forest Labs.",
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

  // Replicate Models
  {
    name: "Playground v2.5",
    value: "replicate-playground-v2.5",
    image: "/assets/model-thumbs/playground-v2-5.jpg",
    description: "High-quality aesthetic model with excellent prompt following.",
    company: "Replicate",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "SDXL (Replicate)",
    value: "replicate-sdxl",
    image: "/assets/model-thumbs/sdxl-replicate.jpg",
    description: "Stable Diffusion XL hosted on Replicate with fast inference.",
    company: "Replicate",
    supportsStyles: true,
    creditCost: 2,
  },
  {
    name: "Kandinsky 2.2",
    value: "replicate-kandinsky-2.2",
    image: "/assets/model-thumbs/kandinsky.jpg",
    description: "Multilingual model with unique artistic style.",
    company: "Replicate",
    supportsStyles: false,
    creditCost: 2,
  },

  // Ideogram Models
  {
    name: "Ideogram V2",
    value: "ideogram-v2",
    image: "/assets/model-thumbs/ideogram-v2.jpg",
    description: "Best-in-class text rendering for logos, signs, and typography.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 4,
  },
  {
    name: "Ideogram V2 Turbo",
    value: "ideogram-v2-turbo",
    image: "/assets/model-thumbs/ideogram-v2-turbo.jpg",
    description: "Fast version of Ideogram V2 with great text rendering.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Ideogram V1",
    value: "ideogram-v1",
    image: "/assets/model-thumbs/ideogram-v1.jpg",
    description: "Original Ideogram model with excellent typography support.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Ideogram V1 Turbo",
    value: "ideogram-v1-turbo",
    image: "/assets/model-thumbs/ideogram-v1-turbo.jpg",
    description: "Budget-friendly Ideogram with quick generation.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 1,
  },

  // Fal.ai Models (unique offerings only)
  {
    name: "SDXL Lightning",
    value: "fal-sdxl-lightning",
    image: "/assets/model-thumbs/sdxl-lightning.jpg",
    description: "Lightning-fast SDXL with 4-step generation.",
    company: "Fal.ai",
    supportsStyles: true,
    creditCost: 1,
  },
  {
    name: "Stable Cascade",
    value: "fal-stable-cascade",
    image: "/assets/model-thumbs/stable-cascade.jpg",
    description: "Wurstchen architecture for high-quality images.",
    company: "Fal.ai",
    supportsStyles: false,
    creditCost: 2,
  },

  // Together AI Models (unique offerings only)
  {
    name: "Flux Schnell (Free)",
    value: "together-flux-schnell",
    image: "/assets/model-thumbs/together-flux-schnell.jpg",
    description: "Free Flux Schnell model via Together AI.",
    company: "Together AI",
    supportsStyles: false,
    creditCost: 1,
  },
  {
    name: "SDXL Turbo",
    value: "together-sd-turbo",
    image: "/assets/model-thumbs/sdxl-turbo.jpg",
    description: "Distilled SDXL for instant generation.",
    company: "Together AI",
    supportsStyles: false,
    creditCost: 1,
  },
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
  // New generation parameters
  width: z.number().min(256).max(2048).optional(),
  height: z.number().min(256).max(2048).optional(),
  quality: z.enum(["standard", "hd", "high", "medium", "low"]).optional(),
  generationStyle: z.enum(["vivid", "natural"]).optional(),
  negativePrompt: z.string().max(1000).optional(),
  seed: z.number().int().min(0).optional(),
  cfgScale: z.number().min(1).max(35).optional(),
  steps: z.number().int().min(10).max(50).optional(),
  promptUpsampling: z.boolean().optional(),
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
  // Generation parameters
  width?: number;
  height?: number;
  quality?: string;
  generationStyle?: string;
  negativePrompt?: string;
  seed?: number;
  cfgScale?: number;
  steps?: number;
  promptUpsampling?: boolean;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const prompt = formData.get("prompt") || "";
  const model = formData.get("model") || "";
  let stylePreset = formData.get("style") || undefined;
  const numberOfImages = formData.get("numberOfImages") || "1";

  // Parse new generation parameters
  const widthStr = formData.get("width");
  const heightStr = formData.get("height");
  const quality = formData.get("quality") || undefined;
  const generationStyle = formData.get("generationStyle") || undefined;
  const negativePrompt = formData.get("negativePrompt") || undefined;
  const seedStr = formData.get("seed");
  const cfgScaleStr = formData.get("cfgScale");
  const stepsStr = formData.get("steps");
  const promptUpsamplingStr = formData.get("promptUpsampling");

  if (stylePreset === "none") {
    stylePreset = undefined;
  }

  // Parse numeric values (undefined if not provided or invalid)
  const width = widthStr ? parseInt(widthStr.toString()) : undefined;
  const height = heightStr ? parseInt(heightStr.toString()) : undefined;
  const seed = seedStr && seedStr !== "" ? parseInt(seedStr.toString()) : undefined;
  const cfgScale = cfgScaleStr ? parseFloat(cfgScaleStr.toString()) : undefined;
  const steps = stepsStr ? parseInt(stepsStr.toString()) : undefined;
  const promptUpsampling = promptUpsamplingStr === "true";

  const validateFormData = CreateImagesFormSchema.safeParse({
    prompt: prompt.toString(),
    numberOfImages: parseInt(numberOfImages.toString()),
    model: model.toString(),
    stylePreset,
    // New generation parameters
    width: isNaN(width as number) ? undefined : width,
    height: isNaN(height as number) ? undefined : height,
    quality: quality?.toString() || undefined,
    generationStyle: generationStyle?.toString() || undefined,
    negativePrompt: negativePrompt?.toString() || undefined,
    seed: isNaN(seed as number) ? undefined : seed,
    cfgScale: isNaN(cfgScale as number) ? undefined : cfgScale,
    steps: isNaN(steps as number) ? undefined : steps,
    promptUpsampling,
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

  // Track if credits were already deducted (to prevent double charging)
  let creditsAlreadyDeducted = false;

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
      creditsAlreadyDeducted = true;

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

    // SUCCESS! Now charge the user credits (unless already charged in Kafka path)
    if (!creditsAlreadyDeducted) {
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
