/**
 * Premium Collections Service
 *
 * Handles premium/gated collections that users can sell access to
 */

import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { logCreditSpend } from "./creditTransaction.server";

// ============================================
// TYPES
// ============================================

export interface PremiumCollectionDetails {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  price: number | null;
  isPublic: boolean;
  isPremium: boolean;
  purchaseCount: number;
  imageCount: number;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
  hasAccess: boolean;
  previewImages: Array<{
    id: string;
    blurDataURL: string | null;
  }>;
}

// ============================================
// PREMIUM COLLECTION OPERATIONS
// ============================================

/**
 * Make a collection premium (paid access)
 */
export async function makeCollectionPremium(
  userId: string,
  collectionId: string,
  price: number,
  options: {
    thumbnail?: string;
    description?: string;
  } = {}
): Promise<void> {
  // Validate price
  if (price < 1 || price > 500) {
    throw new Error("Price must be between 1 and 500 credits");
  }

  // Verify ownership
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: { _count: { select: { images: true } } },
  });

  if (!collection) {
    throw new Error("Collection not found or unauthorized");
  }

  // Must have at least 3 images
  if (collection._count.images < 3) {
    throw new Error("Collection must have at least 3 images to be made premium");
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      isPremium: true,
      isPublic: true, // Premium collections are public but gated
      price,
      ...(options.thumbnail && { thumbnail: options.thumbnail }),
      ...(options.description && { description: options.description }),
    },
  });

  Logger.info({
    message: "[PremiumCollections] Collection made premium",
    metadata: { collectionId, userId, price },
  });
}

/**
 * Remove premium status from collection
 */
export async function removeCollectionPremium(
  userId: string,
  collectionId: string
): Promise<void> {
  // Verify ownership
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });

  if (!collection) {
    throw new Error("Collection not found or unauthorized");
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      isPremium: false,
      price: null,
    },
  });

  Logger.info({
    message: "[PremiumCollections] Premium status removed",
    metadata: { collectionId, userId },
  });
}

/**
 * Update collection premium settings
 */
export async function updatePremiumCollection(
  userId: string,
  collectionId: string,
  updates: {
    price?: number;
    thumbnail?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<void> {
  // Verify ownership and premium status
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId, isPremium: true },
  });

  if (!collection) {
    throw new Error("Premium collection not found or unauthorized");
  }

  if (updates.price !== undefined && (updates.price < 1 || updates.price > 500)) {
    throw new Error("Price must be between 1 and 500 credits");
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      ...(updates.price !== undefined && { price: updates.price }),
      ...(updates.thumbnail && { thumbnail: updates.thumbnail }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.isPublic !== undefined && { isPublic: updates.isPublic }),
    },
  });

  Logger.info({
    message: "[PremiumCollections] Premium collection updated",
    metadata: { collectionId, userId },
  });
}

/**
 * Purchase access to a premium collection
 */
export async function purchaseCollection(
  buyerId: string,
  collectionId: string
): Promise<void> {
  // Get collection details
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, isPremium: true, isPublic: true },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  if (!collection) {
    throw new Error("Premium collection not found or unavailable");
  }

  if (!collection.price) {
    throw new Error("Collection price not set");
  }

  // Can't buy own collection
  if (collection.userId === buyerId) {
    throw new Error("Cannot purchase your own collection");
  }

  // Check if already purchased
  const existingPurchase = await prisma.collectionPurchase.findUnique({
    where: {
      buyerId_collectionId: { buyerId, collectionId },
    },
  });

  if (existingPurchase) {
    throw new Error("You have already purchased this collection");
  }

  // Check buyer's balance
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { credits: true },
  });

  if (!buyer || buyer.credits < collection.price) {
    throw new Error("Insufficient credits");
  }

  // Perform the transaction
  await prisma.$transaction(async (tx) => {
    // Deduct credits from buyer
    await tx.user.update({
      where: { id: buyerId },
      data: { credits: { decrement: collection.price! } },
    });

    // Add credits to seller (minus platform fee - 10%)
    const platformFee = Math.ceil(collection.price! * 0.1);
    const sellerEarnings = collection.price! - platformFee;

    await tx.user.update({
      where: { id: collection.userId },
      data: { credits: { increment: sellerEarnings } },
    });

    // Create purchase record
    await tx.collectionPurchase.create({
      data: {
        buyerId,
        collectionId,
        pricePaid: collection.price!,
      },
    });

    // Update purchase count
    await tx.collection.update({
      where: { id: collectionId },
      data: { purchaseCount: { increment: 1 } },
    });

    // Record earnings for seller
    await tx.creatorEarnings.create({
      data: {
        userId: collection.userId,
        source: "marketplace",
        referenceId: collectionId,
        referenceType: "collection_purchase",
        amount: sellerEarnings,
      },
    });

    // Create notification for seller
    await tx.notification.create({
      data: {
        type: "COLLECTION_PURCHASED",
        recipientId: collection.userId,
        actorId: buyerId,
      },
    });
  });

  // Log credit transaction for buyer (non-blocking)
  logCreditSpend(buyerId, collection.price, `Purchased collection: ${collection.title}`).catch(
    (err) => {
      Logger.error({
        message: "[PremiumCollections] Failed to log credit spend",
        error: err,
      });
    }
  );

  Logger.info({
    message: "[PremiumCollections] Collection purchased",
    metadata: {
      collectionId,
      buyerId,
      sellerId: collection.userId,
      price: collection.price,
    },
  });
}

/**
 * Check if user has access to a collection
 */
export async function hasCollectionAccess(
  userId: string,
  collectionId: string
): Promise<boolean> {
  // Get collection
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true, isPremium: true, isPublic: true },
  });

  if (!collection) return false;

  // Owner always has access
  if (collection.userId === userId) return true;

  // Non-premium public collections are accessible
  if (!collection.isPremium && collection.isPublic) return true;

  // Private non-premium collections are not accessible
  if (!collection.isPremium && !collection.isPublic) return false;

  // For premium collections, check purchase
  const purchase = await prisma.collectionPurchase.findUnique({
    where: {
      buyerId_collectionId: { buyerId: userId, collectionId },
    },
  });

  return !!purchase;
}

/**
 * Get premium collection details with access check
 */
export async function getPremiumCollectionDetails(
  collectionId: string,
  currentUserId?: string
): Promise<PremiumCollectionDetails | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, isPublic: true },
    include: {
      user: { select: { id: true, username: true, image: true } },
      images: {
        include: {
          image: { select: { id: true, blurDataURL: true } },
        },
        take: 6,
      },
      _count: { select: { images: true } },
    },
  });

  if (!collection) return null;

  // Check access
  let hasAccess = false;
  if (currentUserId) {
    hasAccess = await hasCollectionAccess(currentUserId, collectionId);
  }

  // If not premium, everyone has access
  if (!collection.isPremium) {
    hasAccess = true;
  }

  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    thumbnail: collection.thumbnail,
    price: collection.price,
    isPublic: collection.isPublic,
    isPremium: collection.isPremium,
    purchaseCount: collection.purchaseCount,
    imageCount: collection._count.images,
    createdAt: collection.createdAt,
    user: collection.user,
    hasAccess,
    previewImages: collection.images.map((i) => ({
      id: i.image?.id || "",
      blurDataURL: i.image?.blurDataURL || null,
    })),
  };
}

/**
 * Browse premium collections
 */
export async function browsePremiumCollections(
  options: {
    limit?: number;
    offset?: number;
    sortBy?: "newest" | "popular" | "priceAsc" | "priceDesc";
    minImages?: number;
  } = {},
  currentUserId?: string
) {
  const { limit = 20, offset = 0, sortBy = "popular", minImages = 3 } = options;

  const orderByMap = {
    newest: { createdAt: "desc" as const },
    popular: { purchaseCount: "desc" as const },
    priceAsc: { price: "asc" as const },
    priceDesc: { price: "desc" as const },
  };

  const collections = await prisma.collection.findMany({
    where: {
      isPremium: true,
      isPublic: true,
    },
    include: {
      user: { select: { id: true, username: true, image: true } },
      images: {
        include: {
          image: { select: { id: true, blurDataURL: true } },
        },
        take: 4,
      },
      _count: { select: { images: true } },
    },
    orderBy: orderByMap[sortBy],
    take: limit,
    skip: offset,
  });

  // Filter by minimum images
  const filteredCollections = collections.filter((c) => c._count.images >= minImages);

  // Check which collections user has purchased
  let purchasedCollectionIds: Set<string> = new Set();
  if (currentUserId) {
    const purchases = await prisma.collectionPurchase.findMany({
      where: {
        buyerId: currentUserId,
        collectionId: { in: filteredCollections.map((c) => c.id) },
      },
      select: { collectionId: true },
    });
    purchasedCollectionIds = new Set(purchases.map((p) => p.collectionId));
  }

  return filteredCollections.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    thumbnail: c.thumbnail,
    price: c.price,
    purchaseCount: c.purchaseCount,
    imageCount: c._count.images,
    createdAt: c.createdAt,
    user: c.user,
    hasAccess: currentUserId
      ? c.userId === currentUserId || purchasedCollectionIds.has(c.id)
      : false,
    previewImages: c.images.map((i) => ({
      id: i.image?.id || "",
      blurDataURL: i.image?.blurDataURL || null,
    })),
  }));
}

/**
 * Get user's purchased collections
 */
export async function getUserPurchasedCollections(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return prisma.collectionPurchase.findMany({
    where: { buyerId: userId },
    include: {
      collection: {
        include: {
          user: { select: { id: true, username: true, image: true } },
          _count: { select: { images: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get user's premium collections (as seller)
 */
export async function getUserPremiumCollections(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return prisma.collection.findMany({
    where: { userId, isPremium: true },
    include: {
      _count: { select: { images: true, purchases: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get collection earnings summary
 */
export async function getCollectionEarningsSummary(userId: string) {
  const [totalEarnings, totalSales, collections] = await Promise.all([
    prisma.creatorEarnings.aggregate({
      where: { userId, referenceType: "collection_purchase" },
      _sum: { amount: true },
    }),
    prisma.collectionPurchase.count({
      where: { collection: { userId } },
    }),
    prisma.collection.findMany({
      where: { userId, isPremium: true },
      include: {
        _count: { select: { purchases: true } },
      },
      orderBy: { purchaseCount: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalEarnings: totalEarnings._sum.amount ?? 0,
    totalSales,
    topCollections: collections.map((c) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      salesCount: c._count.purchases,
    })),
  };
}
