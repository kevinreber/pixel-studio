import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  type: NotificationType;
  recipientId: string;
  actorId?: string;
  imageId?: string;
  commentId?: string;
}

/**
 * Creates a notification for a user.
 * Used when someone follows them, likes their image, comments on their image, or their image generation completes.
 */
export const createNotification = async ({
  type,
  recipientId,
  actorId,
  imageId,
  commentId,
}: CreateNotificationParams) => {
  // Don't create notification if actor is the same as recipient (e.g., user likes their own image)
  if (actorId && actorId === recipientId) {
    Logger.info({
      message: "Skipping self-notification",
      metadata: { type, recipientId, actorId },
    });
    return null;
  }

  Logger.info({
    message: "Creating notification",
    metadata: { type, recipientId, actorId, imageId, commentId },
  });

  const notification = await prisma.notification.create({
    data: {
      type,
      recipientId,
      actorId,
      imageId,
      commentId,
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      image: {
        select: {
          id: true,
          title: true,
          prompt: true,
        },
      },
      comment: {
        select: {
          id: true,
          message: true,
        },
      },
    },
  });

  return notification;
};
