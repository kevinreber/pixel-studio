import { prisma } from "~/services/prisma.server";
import { createNotification } from "~/server/notifications/createNotification.server";
import { extractMentions } from "~/utils/mentions";
import { Logger } from "~/utils/logger.server";

/**
 * Process @mentions in a comment message.
 * Looks up mentioned usernames and sends IMAGE_COMMENT notifications to them.
 */
export async function processMentions({
  message,
  actorId,
  imageId,
  commentId,
}: {
  message: string;
  actorId: string;
  imageId: string;
  commentId: string;
}) {
  const usernames = extractMentions(message);

  if (usernames.length === 0) return;

  // Look up users by username (case-insensitive match via lowercase stored usernames)
  const mentionedUsers = await prisma.user.findMany({
    where: {
      username: { in: usernames, mode: "insensitive" },
    },
    select: { id: true, username: true },
  });

  // Send notifications to mentioned users
  for (const user of mentionedUsers) {
    try {
      await createNotification({
        type: "IMAGE_COMMENT",
        recipientId: user.id,
        actorId,
        imageId,
        commentId,
      });
    } catch (error) {
      Logger.error({
        message: "Failed to notify mentioned user",
        metadata: {
          mentionedUserId: user.id,
          actorId,
          imageId,
          commentId,
        },
      });
    }
  }
}
