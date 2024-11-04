import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function creates a new image in our DB
 */
export const createNewImage = async ({
  prompt,
  userId,
  model,
  preset = "",
  isImagePrivate = false,
  setId,
}: {
  prompt: string;
  userId: string;
  model: string;
  preset?: string;
  isImagePrivate: boolean;
  setId: string;
}) => {
  console.log("Creating new image in DB...");
  if (!setId) {
    throw new Error("Set ID is required");
  }

  try {
    const image = await prisma.image.create({
      data: {
        prompt,
        title: prompt,
        userId,
        model,
        stylePreset: preset,
        private: isImagePrivate,
        setId,
      },
    });
    console.log(`Successfully created new image in DB: ${image.id}`);

    // Return new image created
    return image;
  } catch (error) {
    console.error(`Error creating new image in DB: ${error}`);
    throw error;
  }
};
