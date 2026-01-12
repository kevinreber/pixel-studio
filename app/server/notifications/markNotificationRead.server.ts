import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

/**
 * Marks a single notification as read.
 */
export const markNotificationRead = async ({
  notificationId,
  userId,
}: {
  notificationId: string;
  userId: string;
}) => {
  Logger.info({
    message: "Marking notification as read",
    metadata: { notificationId, userId },
  });

  // Ensure the user owns this notification
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: {
      read: true,
    },
  });

  return notification.count > 0;
};

/**
 * Marks all notifications as read for a user.
 */
export const markAllNotificationsRead = async (userId: string) => {
  Logger.info({
    message: "Marking all notifications as read",
    metadata: { userId },
  });

  const result = await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result.count;
};
