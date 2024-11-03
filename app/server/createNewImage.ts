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
  if (!setId) {
    throw new Error("Set ID is required");
  }

  const image = await prisma.image.create({
    data: {
      prompt,
      title: prompt,
      userId,
      model,
      stylePreset: preset,
      private: isImagePrivate,
      setId: prompt,
    },
  });

  // Return new image created
  return image;
};
