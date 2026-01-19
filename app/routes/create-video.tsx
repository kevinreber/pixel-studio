import {
  type LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { requireUserLogin } from "~/services";
import CreateVideoPage from "~/pages/CreateVideoPage";
import { createNewVideos, updateUserCredits, checkUserCredits } from "~/server";
import {
  queueVideoGeneration,
  isVideoQueueEnabled,
  getVideoQueueHealth,
} from "~/services/videoQueue.server";
import { z } from "zod";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { cacheDelete } from "~/utils/cache.server";
import { getVideoModelCreditCost } from "~/config/pricing";
import {
  VIDEO_MODEL_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  DURATION_OPTIONS,
} from "~/config/videoModels";
import {
  trackVideoGenerationStarted,
  trackVideoGenerationCompleted,
  trackVideoGenerationFailed,
  trackCreditsSpent,
} from "~/services/analytics.server";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Videos" }];
};

const MAX_PROMPT_CHARACTERS = 2000;

const CreateVideoFormSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, { message: "Prompt cannot be empty" })
    .max(MAX_PROMPT_CHARACTERS, {
      message: `Prompt must be ${MAX_PROMPT_CHARACTERS} characters or less`,
    }),
  model: z
    .string()
    .min(1, { message: "Video model cannot be empty" })
    .refine(
      (value) =>
        VIDEO_MODEL_OPTIONS.some((model) => model.value === value),
      {
        message: "Invalid video model selected",
      }
    ),
  duration: z.number().min(4).max(10).optional(),
  aspectRatio: z
    .string()
    .refine(
      (value) =>
        ASPECT_RATIO_OPTIONS.some((ar) => ar.value === value),
      { message: "Invalid aspect ratio selected" }
    )
    .optional(),
  sourceImageUrl: z.string().url().optional().or(z.literal("")),
  sourceImageId: z.string().optional().or(z.literal("")),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);

  return json({
    modelOptions: VIDEO_MODEL_OPTIONS,
    aspectRatioOptions: ASPECT_RATIO_OPTIONS,
    durationOptions: DURATION_OPTIONS,
  });
};

export type CreateVideoPageLoader = typeof loader;
export type CreateVideoFormData = {
  prompt: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  sourceImageUrl?: string;
  sourceImageId?: string;
  private?: boolean;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();

  const prompt = formData.get("prompt") || "";
  const model = formData.get("model") || "";
  const durationStr = formData.get("duration");
  const aspectRatio = formData.get("aspectRatio") || "16:9";
  const sourceImageUrl = formData.get("sourceImageUrl") || "";
  const sourceImageId = formData.get("sourceImageId") || "";

  const duration = durationStr ? parseInt(durationStr.toString()) : 5;

  const validateFormData = CreateVideoFormSchema.safeParse({
    prompt: prompt.toString(),
    model: model.toString(),
    duration: isNaN(duration) ? 5 : duration,
    aspectRatio: aspectRatio.toString(),
    sourceImageUrl: sourceImageUrl.toString() || undefined,
    sourceImageId: sourceImageId.toString() || undefined,
  });

  if (!validateFormData.success) {
    return json(
      {
        success: false,
        message: "Error invalid form data",
        error: validateFormData.error.flatten(),
      },
      { status: 400 }
    );
  }

  // Check if model requires source image
  const selectedModel = VIDEO_MODEL_OPTIONS.find(
    (m) => m.value === validateFormData.data.model
  );

  if (
    selectedModel &&
    !selectedModel.supportedModes.includes("text-to-video") &&
    !validateFormData.data.sourceImageUrl
  ) {
    return json(
      {
        success: false,
        message: "This model requires a source image",
        error: "Please upload or select an image to generate video from.",
      },
      { status: 400 }
    );
  }

  // Calculate total credit cost based on duration
  const modelValue = validateFormData.data.model;
  const videoDuration = validateFormData.data.duration || 5;
  const totalCreditCost = getVideoModelCreditCost(modelValue, videoDuration);

  // Check if user has enough credits
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
            : `Not enough credits. This video generation requires ${totalCreditCost} credits.`,
      },
      { status: 400 }
    );
  }

  // Check if async queue processing is enabled (QStash or Kafka)
  const asyncQueueEnabled = isVideoQueueEnabled();

  // Track if credits were already deducted
  let creditsAlreadyDeducted = false;

  if (asyncQueueEnabled) {
    try {
      // 🚀 Async Queue: Use QStash (default) or Kafka for async generation
      console.log("[Create Video] Using async queue for video generation...");

      // Health check - verify queue backend is available
      const queueHealth = await getVideoQueueHealth();
      if (!queueHealth.healthy) {
        throw new Error(
          `Video generation service is temporarily unavailable: ${queueHealth.message}`
        );
      }

      // Charge upfront since it's async
      // The worker should handle refunds on failure
      await updateUserCredits(user.id, totalCreditCost);
      creditsAlreadyDeducted = true;

      // Clear cache for user
      const cacheKey = `user-login:${user.id}`;
      await cacheDelete(cacheKey);

      // Queue the video generation request (returns immediately!)
      const response = await queueVideoGeneration(validateFormData.data, user.id);

      console.log(
        `Successfully queued video generation request: ${response.requestId} via ${queueHealth.backend}`
      );

      // Track video generation started
      trackVideoGenerationStarted(user.id, {
        prompt: validateFormData.data.prompt,
        model: validateFormData.data.model,
        duration: validateFormData.data.duration,
        aspectRatio: validateFormData.data.aspectRatio,
        creditCost: totalCreditCost,
        sourceImageId: validateFormData.data.sourceImageId,
        setId: response.requestId,
      });

      // Return JSON with requestId so client can track progress via toast
      return json({
        success: true,
        async: true,
        requestId: response.requestId,
        processingUrl: response.processingUrl,
        message: "Video generation started",
        prompt: validateFormData.data.prompt,
      });
    } catch (error) {
      console.error(
        "Async video generation failed, falling back to synchronous:",
        error
      );
      // Continue to synchronous fallback below
    }
  }

  // Synchronous generation (fallback)
  console.log("Using synchronous video generation...");

  try {
    const result = await createNewVideos(validateFormData.data, user.id);

    if ("error" in result && result.error) {
      return json({
        success: false,
        message: "Video generation failed",
        error: result.error,
        videos: [],
        setId: "",
      });
    }

    if (!result.setId || !result.videos?.length) {
      throw new Error("Failed to create video - incomplete response");
    }

    // Charge credits on success
    if (!creditsAlreadyDeducted) {
      try {
        await updateUserCredits(user.id, totalCreditCost);
        const cacheKey = `user-login:${user.id}`;
        await cacheDelete(cacheKey);
      } catch (creditError) {
        console.error(
          "Failed to deduct credits after successful generation:",
          creditError
        );
      }
    }

    // Track successful synchronous generation
    trackVideoGenerationCompleted(user.id, {
      prompt: validateFormData.data.prompt,
      model: validateFormData.data.model,
      duration: validateFormData.data.duration,
      aspectRatio: validateFormData.data.aspectRatio,
      creditCost: totalCreditCost,
      setId: result.setId,
    });

    trackCreditsSpent(user.id, totalCreditCost, "video_generation");

    // Redirect to the set page
    return redirect(`/sets/${result.setId}`);
  } catch (error) {
    console.error(`Error creating video: ${error}`);

    // Track failed generation
    trackVideoGenerationFailed(user.id, {
      prompt: validateFormData.data.prompt,
      model: validateFormData.data.model,
      duration: validateFormData.data.duration,
      aspectRatio: validateFormData.data.aspectRatio,
      creditCost: totalCreditCost,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return json(
      {
        success: false,
        message: "Failed to create video",
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
};

export type ActionData = {
  success: boolean;
  message?: string;
  error?: string | { [key: string]: string[] };
  videos?: { id: string; url: string }[];
  setId?: string;
  // Async generation fields
  async?: boolean;
  requestId?: string;
  processingUrl?: string;
  prompt?: string;
};

export type CreateVideoPageActionData = typeof action;

export default function Index() {
  return <CreateVideoPage />;
}

export function ErrorBoundary() {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
