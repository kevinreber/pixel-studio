import { prisma } from "~/services/prisma.server";

/**
 * Get or create a conversation between two users.
 * Always stores the lower ID as user1Id to enforce uniqueness.
 */
export async function getOrCreateConversation(userIdA: string, userIdB: string) {
  const [user1Id, user2Id] = [userIdA, userIdB].sort();

  return prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    update: {},
    create: { user1Id, user2Id },
  });
}

/**
 * Get all conversations for a user, with the latest message and the other user's info.
 */
export async function getUserConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: { select: { id: true, username: true, image: true } },
      user2: { select: { id: true, username: true, image: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          read: true,
          createdAt: true,
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
    const lastMessage = conv.messages[0] ?? null;
    return {
      id: conv.id,
      otherUser,
      lastMessage,
      updatedAt: conv.lastMessageAt,
    };
  });
}

/**
 * Get messages for a conversation with pagination.
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  page = 1,
  pageSize = 50
) {
  // Verify user is part of conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  if (!conversation) return null;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Mark unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      read: false,
      NOT: { senderId: userId },
    },
    data: { read: true },
  });

  return messages.reverse();
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  // Verify sender is part of conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: senderId }, { user2Id: senderId }],
    },
  });

  if (!conversation) return null;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: { select: { id: true, username: true, image: true } },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return message;
}

/**
 * Get unread message count for a user.
 */
export async function getUnreadMessageCount(userId: string) {
  return prisma.message.count({
    where: {
      read: false,
      NOT: { senderId: userId },
      conversation: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    },
  });
}
