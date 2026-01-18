import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { createNotification } from "./notifications";

/**
 * @description
 * This function creates a User's Like for an Image
 */
export const createImageLike = async ({
  imageId,
  userId,
}: {
  imageId: string;
  userId: string;
}) => {
  Logger.info({
    message: `Creating Image Like`,
    metadata: { imageId, userId },
  });

  const data = { userId, imageId };

  const response = await prisma.imageLike.create({ data });

  // Fetch the image owner to send notification
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    select: { userId: true },
  });

  if (image) {
    await createNotification({
      type: "IMAGE_LIKED",
      recipientId: image.userId,
      actorId: userId,
      imageId,
    });
  }

  return response;
};
