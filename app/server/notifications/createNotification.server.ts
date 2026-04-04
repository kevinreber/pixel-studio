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

// Map notification types to user preference fields
const NOTIFICATION_PREF_MAP: Partial<Record<NotificationType, string>> = {
  NEW_FOLLOWER: "notifyFollowers",
  IMAGE_LIKED: "notifyLikes",
  IMAGE_COMMENT: "notifyComments",
  ACHIEVEMENT_UNLOCKED: "notifyAchievements",
  STREAK_MILESTONE: "notifyStreaks",
};

/**
 * Creates a notification for a user.
 * Respects user notification preferences — skips creation if user has disabled the type.
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

  // Check user notification preferences
  const prefField = NOTIFICATION_PREF_MAP[type];
  if (prefField) {
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        notifyFollowers: true,
        notifyLikes: true,
        notifyComments: true,
        notifyAchievements: true,
        notifyStreaks: true,
      },
    });

    if (recipient && recipient[prefField as keyof typeof recipient] === false) {
      Logger.info({
        message: "Skipping notification - user preference disabled",
        metadata: { type, recipientId, prefField },
      });
      return null;
    }
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
