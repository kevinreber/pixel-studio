import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

/**
 * Deletes a notification. Only the recipient can delete their notifications.
 */
export const deleteNotification = async ({
  notificationId,
  userId,
}: {
  notificationId: string;
  userId: string;
}) => {
  Logger.info({
    message: "Deleting notification",
    metadata: { notificationId, userId },
  });

  // Ensure the user owns this notification
  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
  });

  return result.count > 0;
};
