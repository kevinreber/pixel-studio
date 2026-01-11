import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import {
  createNewImages,
  updateUserCredits,
  checkUserCredits,
} from "~/server";
import { getImageGenerationProducer } from "~/services/imageGenerationProducer.server";
import { z } from "zod";
import { cacheDelete } from "~/utils/cache.server";
import { getModelCreditCost } from "~/config/pricing";
import { MODEL_OPTIONS } from "~/routes/create";

const RemixFormSchema = z.object({
  model: z
    .string()
    .min(1, { message: "Model is required" })
    .refine(
      (value) => MODEL_OPTIONS.some((model) => model.value === value),
      { message: "Invalid model selected" }
    ),
});

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const { imageId } = params;

  if (!imageId) {
    return json({ error: "Image ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const model = formData.get("model")?.toString();

  // Validate the form data
  const validateFormData = RemixFormSchema.safeParse({ model });

  if (!validateFormData.success) {
    return json(
      {
        success: false,
        message: "Invalid form data",
        error: validateFormData.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    // Get the original image to remix
    const originalImage = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        prompt: true,
        stylePreset: true,
        width: true,
        height: true,
        negativePrompt: true,
      },
    });

    if (!originalImage) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    // Calculate credit cost
    const creditCostPerImage = getModelCreditCost(validateFormData.data.model);
    const totalCreditCost = creditCostPerImage; // Remixing creates 1 image

    // Check if user has enough credits
    try {
      await checkUserCredits(user.id, totalCreditCost);
    } catch (error: unknown) {
      return json(
        {
          success: false,
          message: "Insufficient credits",
          error:
            error instanceof Error
              ? error.message
              : `Not enough credits. This remix requires ${totalCreditCost} credits.`,
        },
        { status: 400 }
      );
    }

    // Prepare remix data - use original prompt with new model
    const remixFormData = {
      prompt: originalImage.prompt,
      numberOfImages: 1,
      model: validateFormData.data.model,
      stylePreset: originalImage.stylePreset || undefined,
      width: originalImage.width || undefined,
      height: originalImage.height || undefined,
      negativePrompt: originalImage.negativePrompt || undefined,
      // Remix metadata
      isRemix: true,
      parentImageId: originalImage.id,
    };

    // Check if Kafka-based async generation is enabled
    const isProduction = process.env.NODE_ENV === "production";
    const isKafkaEnabled =
      !isProduction && process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true";

    let creditsAlreadyDeducted = false;

    if (isKafkaEnabled) {
      try {
        console.log("Using Kafka for async remix generation...");

        const producer = await getImageGenerationProducer();
        const isKafkaHealthy = await producer.healthCheck();

        if (!isKafkaHealthy) {
          throw new Error("Image generation service is temporarily unavailable");
        }

        // Charge upfront for async generation
        await updateUserCredits(user.id, totalCreditCost);
        creditsAlreadyDeducted = true;

        // Clear cache
        const cacheKey = `user-login:${user.id}`;
        await cacheDelete(cacheKey);
        const setsCacheKey = `sets:user:${user.id}:undefined:undefined`;
        await cacheDelete(setsCacheKey);

        // Queue the remix request
        const response = await producer.queueImageGeneration(
          remixFormData,
          user.id
        );

        console.log(`Successfully queued remix request: ${response.requestId}`);

        return redirect(response.processingUrl);
      } catch (error) {
        console.error("Kafka remix failed, falling back to synchronous:", error);
      }
    }

    // Synchronous generation
    console.log("Using synchronous remix generation...");

    try {
      const result = await createNewImages(remixFormData, user.id);

      if ("error" in result) {
        return json({
          success: false,
          message: "Remix generation failed",
          error: result.error,
        });
      }

      if (!result.setId || !result.images?.length) {
        throw new Error("Failed to create remix - incomplete response");
      }

      // Charge credits after success
      if (!creditsAlreadyDeducted) {
        try {
          await updateUserCredits(user.id, totalCreditCost);
          const cacheKey = `user-login:${user.id}`;
          await cacheDelete(cacheKey);
          const setsCacheKey = `sets:user:${user.id}:undefined:undefined`;
          await cacheDelete(setsCacheKey);
        } catch (creditError) {
          console.error("Failed to deduct credits after successful remix:", creditError);
        }
      }

      return redirect(`/sets/${result.setId}`);
    } catch (error) {
      console.error(`Error creating remix: ${error}`);

      return json(
        {
          success: false,
          message: "Failed to create remix",
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in remix action:", error);
    return json(
      {
        success: false,
        error: "Failed to remix image",
      },
      { status: 500 }
    );
  }
};
