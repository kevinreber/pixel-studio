import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

interface GetNotificationsParams {
  userId: string;
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

export interface NotificationWithDetails {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    image: string | null;
  } | null;
  image: {
    id: string;
    title: string | null;
    prompt: string;
  } | null;
  comment: {
    id: string;
    message: string;
  } | null;
}

/**
 * Gets notifications for a user with pagination support.
 */
export const getNotifications = async ({
  userId,
  limit = 20,
  cursor,
  unreadOnly = false,
}: GetNotificationsParams): Promise<{
  notifications: NotificationWithDetails[];
  nextCursor: string | null;
}> => {
  Logger.info({
    message: "Getting notifications",
    metadata: { userId, limit, cursor, unreadOnly },
  });

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit + 1, // Fetch one extra to determine if there's a next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

  let nextCursor: string | null = null;
  if (notifications.length > limit) {
    const nextItem = notifications.pop();
    nextCursor = nextItem?.id ?? null;
  }

  return {
    notifications,
    nextCursor,
  };
};

/**
 * Gets the count of unread notifications for a user.
 */
export const getUnreadNotificationCount = async (
  userId: string
): Promise<number> => {
  const count = await prisma.notification.count({
    where: {
      recipientId: userId,
      read: false,
    },
  });

  return count;
};
