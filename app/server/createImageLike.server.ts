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

  // Include image relation to get owner's userId in a single query
  const response = await prisma.imageLike.create({
    data,
    include: {
      image: {
        select: { userId: true },
      },
    },
  });

  // Create notification for image owner
  await createNotification({
    type: "IMAGE_LIKED",
    recipientId: response.image.userId,
    actorId: userId,
    imageId,
  });

  return response;
};
