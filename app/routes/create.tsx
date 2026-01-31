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
import {
  queueImageGeneration,
  queueComparisonGeneration,
  isQueueEnabled,
  getQueueHealth,
} from "~/services/imageQueue.server";
import { z } from "zod";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { cacheDelete } from "~/utils/cache.server";
import { getModelCreditCost } from "~/config/pricing";
import { MODEL_OPTIONS, STYLE_OPTIONS } from "~/config/models";
import {
  trackImageGenerationStarted,
  trackImageGenerationCompleted,
  trackImageGenerationFailed,
  trackCreditsSpent,
} from "~/services/analytics.server";

// Re-export for backwards compatibility
export { MODEL_OPTIONS, STYLE_OPTIONS } from "~/config/models";
export type { ModelOption, StyleOption } from "~/config/models";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Images" }];
};

const MAX_PROMPT_CHARACTERS = 3500;
const MIN_NUMBER_OF_IMAGES = 1;
const MAX_NUMBER_OF_IMAGES = 10;
const MAX_COMPARISON_MODELS = 4; // Max models for comparison mode

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
  // Single model for standard mode
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
    )
    .optional(),
  // Multiple models for comparison mode
  models: z
    .array(z.string())
    .min(2, { message: "Select at least 2 models for comparison" })
    .max(MAX_COMPARISON_MODELS, {
      message: `Maximum ${MAX_COMPARISON_MODELS} models allowed for comparison`,
    })
    .refine(
      (values) =>
        values.every((value) =>
          MODEL_OPTIONS.some((model) => model.value.includes(value))
        ),
      { message: "One or more selected models are invalid" }
    )
    .optional(),
  // Flag to indicate comparison mode
  comparisonMode: z.boolean().optional().default(false),
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
}).refine(
  (data) => {
    // Must have either model (standard) or models (comparison)
    if (data.comparisonMode) {
      return data.models && data.models.length >= 2;
    }
    return !!data.model;
  },
  {
    message: "Select a model for standard mode or at least 2 models for comparison mode",
    path: ["model"],
  }
);

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
  // Remix fields
  isRemix?: boolean;
  parentImageId?: string;
};

// Extended form data for comparison mode
export type ComparisonFormData = {
  prompt: string;
  numberOfImages: number;
  models: string[]; // Multiple models
  stylePreset?: string;
  private?: boolean;
  comparisonMode: true;
  // Generation parameters
  width?: number;
  height?: number;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const prompt = formData.get("prompt") || "";
  const model = formData.get("model") || "";
  const modelsJson = formData.get("models"); // JSON array for comparison mode
  const comparisonModeStr = formData.get("comparisonMode");
  let stylePreset = formData.get("style") || undefined;
  const numberOfImages = formData.get("numberOfImages") || "1";

  // Parse comparison mode
  const comparisonMode = comparisonModeStr === "true";
  let models: string[] | undefined;
  if (comparisonMode && modelsJson) {
    try {
      models = JSON.parse(modelsJson.toString());
    } catch {
      models = undefined;
    }
  }

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
    model: comparisonMode ? undefined : model.toString(),
    models: comparisonMode ? models : undefined,
    comparisonMode,
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

  // Calculate total credit cost based on model(s) and number of images
  const isComparisonMode = validateFormData.data.comparisonMode;
  let totalCreditCost: number;

  if (isComparisonMode && validateFormData.data.models) {
    // Comparison mode: sum of credit costs for all models
    totalCreditCost = validateFormData.data.models.reduce((sum, modelValue) => {
      return sum + getModelCreditCost(modelValue) * validateFormData.data.numberOfImages;
    }, 0);
  } else {
    // Standard mode: single model cost
    const modelValue = validateFormData.data.model!;
    const creditCostPerImage = getModelCreditCost(modelValue);
    totalCreditCost = creditCostPerImage * validateFormData.data.numberOfImages;
  }

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

  // Check if async queue processing is enabled (QStash or Kafka)
  const asyncQueueEnabled = isQueueEnabled();

  // Track if credits were already deducted (to prevent double charging)
  let creditsAlreadyDeducted = false;

  if (asyncQueueEnabled) {
    try {
      // 🚀 Async Queue: Use QStash (default) or Kafka for async generation
      console.log("[Create] Using async queue for image generation...");

      // Health check - verify queue backend is available
      const queueHealth = await getQueueHealth();
      if (!queueHealth.healthy) {
        throw new Error(
          `Image generation service is temporarily unavailable: ${queueHealth.message}`
        );
      }

      // Charge upfront since it's async
      // The worker should handle refunds on failure
      await updateUserCredits(user.id, totalCreditCost);
      creditsAlreadyDeducted = true;

      // Clear cache for user
      const cacheKey = `user-login:${user.id}`;
      await cacheDelete(cacheKey);
      const setsCacheKey = `sets:user:${user.id}:undefined:undefined`;
      await cacheDelete(setsCacheKey);

      let response;

      if (isComparisonMode && validateFormData.data.models) {
        // 🔄 Comparison mode: Queue generations for multiple models
        console.log(`[Create] Comparison mode with ${validateFormData.data.models.length} models`);
        response = await queueComparisonGeneration(
          {
            prompt: validateFormData.data.prompt,
            numberOfImages: validateFormData.data.numberOfImages,
            models: validateFormData.data.models,
            stylePreset: validateFormData.data.stylePreset,
            private: false,
            comparisonMode: true,
            width: validateFormData.data.width,
            height: validateFormData.data.height,
          },
          user.id,
          totalCreditCost
        );

        // Track comparison generation started
        trackImageGenerationStarted(user.id, {
          prompt: validateFormData.data.prompt,
          model: validateFormData.data.models.join(","), // Comma-separated list
          numberOfImages: validateFormData.data.numberOfImages * validateFormData.data.models.length,
          width: validateFormData.data.width,
          height: validateFormData.data.height,
          stylePreset: validateFormData.data.stylePreset,
          creditCost: totalCreditCost,
          isAsync: true,
          setId: response.requestId,
        });

        // Return JSON with requestId and comparison flag
        return json({
          success: true,
          async: true,
          comparisonMode: true,
          requestId: response.requestId,
          processingUrl: response.processingUrl,
          message: `Comparison generation started with ${validateFormData.data.models.length} models`,
          prompt: validateFormData.data.prompt,
          models: validateFormData.data.models,
        });
      } else {
        // Standard single-model mode
        const standardFormData: CreateImagesFormData = {
          ...validateFormData.data,
          model: validateFormData.data.model!,
        };
        response = await queueImageGeneration(standardFormData, user.id);

        console.log(
          `Successfully queued image generation request: ${response.requestId} via ${queueHealth.backend}`
        );

        // Track image generation started
        trackImageGenerationStarted(user.id, {
          prompt: validateFormData.data.prompt,
          model: validateFormData.data.model!,
          numberOfImages: validateFormData.data.numberOfImages,
          width: validateFormData.data.width,
          height: validateFormData.data.height,
          stylePreset: validateFormData.data.stylePreset,
          creditCost: totalCreditCost,
          isAsync: true,
          setId: response.requestId,
        });

        // Return JSON with requestId so client can track progress via toast
        return json({
          success: true,
          async: true,
          requestId: response.requestId,
          processingUrl: response.processingUrl,
          message: "Image generation started",
          prompt: validateFormData.data.prompt,
        });
      }
    } catch (error) {
      console.error(
        "Async queue image generation failed, falling back to synchronous:",
        error
      );
      // Fall through to synchronous generation below
    }
  }

  // 🔄 Synchronous generation (used when async queue is disabled or fails)
  // Note: Comparison mode is NOT supported in synchronous mode
  if (isComparisonMode) {
    return json(
      {
        success: false,
        message: "Comparison mode requires async processing",
        error: "The async queue is not available. Please try again later or use single model mode.",
      },
      { status: 503 }
    );
  }

  console.log("Using synchronous image generation...");

  // Build form data with required model field
  const syncFormData: CreateImagesFormData = {
    ...validateFormData.data,
    model: validateFormData.data.model!,
  };

  try {
    const result = await createNewImages(syncFormData, user.id);

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

    // Track successful synchronous generation
    trackImageGenerationCompleted(user.id, {
      prompt: validateFormData.data.prompt,
      model: syncFormData.model,
      numberOfImages: validateFormData.data.numberOfImages,
      width: validateFormData.data.width,
      height: validateFormData.data.height,
      stylePreset: validateFormData.data.stylePreset,
      creditCost: totalCreditCost,
      isAsync: false,
      setId: result.setId,
    });

    trackCreditsSpent(user.id, totalCreditCost, "image_generation");

    // Redirect to the set page
    return redirect(`/sets/${result.setId}`);
  } catch (error) {
    console.error(`Error creating new images: ${error}`);

    // Track failed generation
    trackImageGenerationFailed(user.id, {
      prompt: validateFormData.data.prompt,
      model: syncFormData.model,
      numberOfImages: validateFormData.data.numberOfImages,
      creditCost: totalCreditCost,
      isAsync: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

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
  // Async generation fields
  async?: boolean;
  requestId?: string;
  processingUrl?: string;
  prompt?: string;
  // Comparison mode fields
  comparisonMode?: boolean;
  models?: string[];
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
