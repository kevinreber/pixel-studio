/**
 * Creator Tipping Service
 *
 * Handles tipping between users to support creators
 */

import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { logCreditSpend } from "./creditTransaction.server";

// ============================================
// TYPES
// ============================================

export interface TipParams {
  recipientId: string;
  amount: number;
  message?: string;
  imageId?: string;
}

export interface TipDetails {
  id: string;
  amount: number;
  message: string | null;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    image: string | null;
  };
  recipient: {
    id: string;
    username: string;
    image: string | null;
  };
  image?: {
    id: string;
    title: string | null;
  } | null;
}

// ============================================
// TIP OPERATIONS
// ============================================

/**
 * Send a tip to a creator
 */
export async function sendTip(senderId: string, params: TipParams): Promise<{ tipId: string }> {
  const { recipientId, amount, message, imageId } = params;

  // Validate amount
  if (amount < 1) {
    throw new Error("Tip amount must be at least 1 credit");
  }

  if (amount > 1000) {
    throw new Error("Maximum tip amount is 1000 credits");
  }

  // Can't tip yourself
  if (senderId === recipientId) {
    throw new Error("Cannot tip yourself");
  }

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, username: true },
  });

  if (!recipient) {
    throw new Error("Recipient not found");
  }

  // If tipping for a specific image, verify it exists and belongs to recipient
  if (imageId) {
    const image = await prisma.image.findFirst({
      where: { id: imageId, userId: recipientId },
    });

    if (!image) {
      throw new Error("Image not found or doesn't belong to recipient");
    }
  }

  // Check sender's balance
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { credits: true },
  });

  if (!sender || sender.credits < amount) {
    throw new Error("Insufficient credits");
  }

  // Perform the transaction
  const tip = await prisma.$transaction(async (tx) => {
    // Deduct credits from sender
    await tx.user.update({
      where: { id: senderId },
      data: { credits: { decrement: amount } },
    });

    // Add credits to recipient (100% goes to creator - no platform fee on tips)
    await tx.user.update({
      where: { id: recipientId },
      data: { credits: { increment: amount } },
    });

    // Create tip record
    const newTip = await tx.tip.create({
      data: {
        senderId,
        recipientId,
        amount,
        message: message?.slice(0, 500), // Limit message length
        imageId,
      },
    });

    // Record earnings for recipient
    await tx.creatorEarnings.create({
      data: {
        userId: recipientId,
        source: "tips",
        referenceId: newTip.id,
        referenceType: "tip",
        amount,
      },
    });

    // Create notification for recipient
    await tx.notification.create({
      data: {
        type: "TIP_RECEIVED",
        recipientId,
        actorId: senderId,
        imageId,
      },
    });

    return newTip;
  });

  // Log credit transaction for sender (non-blocking)
  logCreditSpend(senderId, amount, `Tip to @${recipient.username}`).catch((err) => {
    Logger.error({
      message: "[Tipping] Failed to log credit spend",
      error: err,
    });
  });

  Logger.info({
    message: "[Tipping] Tip sent successfully",
    metadata: {
      tipId: tip.id,
      senderId,
      recipientId,
      amount,
      imageId,
    },
  });

  return { tipId: tip.id };
}

/**
 * Get tips received by a user
 */
export async function getTipsReceived(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    imageId?: string;
  } = {}
): Promise<TipDetails[]> {
  const { limit = 20, offset = 0, imageId } = options;

  const tips = await prisma.tip.findMany({
    where: {
      recipientId: userId,
      ...(imageId && { imageId }),
    },
    include: {
      sender: { select: { id: true, username: true, image: true } },
      recipient: { select: { id: true, username: true, image: true } },
      image: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return tips;
}

/**
 * Get tips sent by a user
 */
export async function getTipsSent(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<TipDetails[]> {
  const { limit = 20, offset = 0 } = options;

  const tips = await prisma.tip.findMany({
    where: { senderId: userId },
    include: {
      sender: { select: { id: true, username: true, image: true } },
      recipient: { select: { id: true, username: true, image: true } },
      image: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return tips;
}

/**
 * Get tip statistics for a user
 */
export async function getTipStats(userId: string) {
  const [totalReceived, totalSent, tipCount, topTippers] = await Promise.all([
    prisma.tip.aggregate({
      where: { recipientId: userId },
      _sum: { amount: true },
    }),
    prisma.tip.aggregate({
      where: { senderId: userId },
      _sum: { amount: true },
    }),
    prisma.tip.count({
      where: { recipientId: userId },
    }),
    // Get top tippers (people who tip this user the most)
    prisma.tip.groupBy({
      by: ["senderId"],
      where: { recipientId: userId },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  // Get tipper details
  const tipperIds = topTippers.map((t) => t.senderId);
  const tippers = await prisma.user.findMany({
    where: { id: { in: tipperIds } },
    select: { id: true, username: true, image: true },
  });

  const tipperMap = new Map(tippers.map((t) => [t.id, t]));

  return {
    totalReceived: totalReceived._sum.amount ?? 0,
    totalSent: totalSent._sum.amount ?? 0,
    tipCount,
    topTippers: topTippers.map((t) => ({
      user: tipperMap.get(t.senderId),
      totalAmount: t._sum.amount ?? 0,
      tipCount: t._count.id,
    })),
  };
}

/**
 * Get tips for a specific image
 */
export async function getImageTips(
  imageId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<TipDetails[]> {
  const { limit = 20, offset = 0 } = options;

  const tips = await prisma.tip.findMany({
    where: { imageId },
    include: {
      sender: { select: { id: true, username: true, image: true } },
      recipient: { select: { id: true, username: true, image: true } },
      image: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return tips;
}

/**
 * Get total tips for an image
 */
export async function getImageTipTotal(imageId: string): Promise<{ total: number; count: number }> {
  const result = await prisma.tip.aggregate({
    where: { imageId },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    total: result._sum.amount ?? 0,
    count: result._count.id,
  };
}

/**
 * Get recent tips across the platform (for social feed)
 */
export async function getRecentTips(limit: number = 10): Promise<TipDetails[]> {
  const tips = await prisma.tip.findMany({
    include: {
      sender: { select: { id: true, username: true, image: true } },
      recipient: { select: { id: true, username: true, image: true } },
      image: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return tips;
}

/**
 * Get tipping leaderboard (top tippers or top receivers)
 */
export async function getTippingLeaderboard(
  type: "tippers" | "receivers",
  limit: number = 10
) {
  const field = type === "tippers" ? "senderId" : "recipientId";

  const leaderboard = await prisma.tip.groupBy({
    by: [field],
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  // Get user details
  const userIds = leaderboard.map((l) => l[field]);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, image: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return leaderboard.map((l) => ({
    user: userMap.get(l[field]),
    totalAmount: l._sum.amount ?? 0,
    tipCount: l._count.id,
  }));
}
