/**
 * Prompt Marketplace Service
 *
 * Handles all marketplace operations including:
 * - Publishing and managing prompts for sale
 * - Purchasing prompts
 * - Reviews and ratings
 * - Marketplace discovery
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import { logCreditSpend } from "./creditTransaction.server";

// ============================================
// TYPES
// ============================================

export interface PublishPromptParams {
  title: string;
  description?: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  tags: string[];
  price: number;
  recommendedModel?: string;
  recommendedStyle?: string;
  recommendedParams?: Record<string, unknown>;
  sampleImageIds?: string[];
}

export interface MarketplaceSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "newest" | "popular" | "topRated" | "priceAsc" | "priceDesc";
  limit?: number;
  offset?: number;
}

export interface MarketplacePromptWithDetails {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  price: number;
  purchaseCount: number;
  viewCount: number;
  averageRating: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
  sampleImageIds: string[];
  reviewCount: number;
  isPurchased?: boolean;
}

// ============================================
// PROMPT PUBLISHING
// ============================================

/**
 * Publish a prompt to the marketplace
 */
export async function publishPrompt(
  userId: string,
  params: PublishPromptParams
): Promise<{ id: string }> {
  // Validate price
  if (params.price < 1 || params.price > 1000) {
    throw new Error("Price must be between 1 and 1000 credits");
  }

  // Validate tags
  if (params.tags.length > 10) {
    throw new Error("Maximum 10 tags allowed");
  }

  // Verify sample images belong to user
  if (params.sampleImageIds && params.sampleImageIds.length > 0) {
    const images = await prisma.image.findMany({
      where: {
        id: { in: params.sampleImageIds },
        userId,
      },
      select: { id: true },
    });

    if (images.length !== params.sampleImageIds.length) {
      throw new Error("Some sample images not found or unauthorized");
    }
  }

  const prompt = await prisma.marketplacePrompt.create({
    data: {
      userId,
      title: params.title,
      description: params.description,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      category: params.category.toLowerCase(),
      tags: params.tags.map((t) => t.toLowerCase()),
      price: params.price,
      recommendedModel: params.recommendedModel,
      recommendedStyle: params.recommendedStyle,
      recommendedParams: params.recommendedParams as Prisma.InputJsonValue | undefined,
      sampleImageIds: params.sampleImageIds || [],
      isPublished: true,
    },
  });

  Logger.info({
    message: "[Marketplace] Prompt published",
    metadata: { promptId: prompt.id, userId },
  });

  return { id: prompt.id };
}

/**
 * Update a marketplace prompt
 */
export async function updatePrompt(
  userId: string,
  promptId: string,
  updates: Partial<PublishPromptParams>
): Promise<void> {
  // Verify ownership
  const existing = await prisma.marketplacePrompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!existing) {
    throw new Error("Prompt not found or unauthorized");
  }

  await prisma.marketplacePrompt.update({
    where: { id: promptId },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.category && { category: updates.category.toLowerCase() }),
      ...(updates.tags && { tags: updates.tags.map((t) => t.toLowerCase()) }),
      ...(updates.price && { price: updates.price }),
      ...(updates.recommendedModel && { recommendedModel: updates.recommendedModel }),
      ...(updates.recommendedStyle && { recommendedStyle: updates.recommendedStyle }),
      ...(updates.recommendedParams && { recommendedParams: updates.recommendedParams as Prisma.InputJsonValue }),
      ...(updates.sampleImageIds && { sampleImageIds: updates.sampleImageIds }),
    },
  });

  Logger.info({
    message: "[Marketplace] Prompt updated",
    metadata: { promptId, userId },
  });
}

/**
 * Unpublish a prompt (soft delete)
 */
export async function unpublishPrompt(userId: string, promptId: string): Promise<void> {
  const existing = await prisma.marketplacePrompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!existing) {
    throw new Error("Prompt not found or unauthorized");
  }

  await prisma.marketplacePrompt.update({
    where: { id: promptId },
    data: { isPublished: false },
  });

  Logger.info({
    message: "[Marketplace] Prompt unpublished",
    metadata: { promptId, userId },
  });
}

/**
 * Delete a prompt permanently
 */
export async function deletePrompt(userId: string, promptId: string): Promise<void> {
  const existing = await prisma.marketplacePrompt.findFirst({
    where: { id: promptId, userId },
  });

  if (!existing) {
    throw new Error("Prompt not found or unauthorized");
  }

  // Check if prompt has any purchases
  const purchaseCount = await prisma.promptPurchase.count({
    where: { promptId },
  });

  if (purchaseCount > 0) {
    throw new Error("Cannot delete prompt with existing purchases. Unpublish instead.");
  }

  await prisma.marketplacePrompt.delete({
    where: { id: promptId },
  });

  Logger.info({
    message: "[Marketplace] Prompt deleted",
    metadata: { promptId, userId },
  });
}

// ============================================
// PROMPT PURCHASING
// ============================================

/**
 * Purchase a prompt from the marketplace
 */
export async function purchasePrompt(
  buyerId: string,
  promptId: string
): Promise<{ prompt: string; negativePrompt: string | null }> {
  // Get prompt details
  const prompt = await prisma.marketplacePrompt.findFirst({
    where: { id: promptId, isPublished: true },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  if (!prompt) {
    throw new Error("Prompt not found or no longer available");
  }

  // Can't buy own prompt
  if (prompt.userId === buyerId) {
    throw new Error("Cannot purchase your own prompt");
  }

  // Check if already purchased
  const existingPurchase = await prisma.promptPurchase.findUnique({
    where: {
      buyerId_promptId: { buyerId, promptId },
    },
  });

  if (existingPurchase) {
    throw new Error("You have already purchased this prompt");
  }

  // Check buyer's balance
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { credits: true },
  });

  if (!buyer || buyer.credits < prompt.price) {
    throw new Error("Insufficient credits");
  }

  // Perform the transaction
  await prisma.$transaction(async (tx) => {
    // Deduct credits from buyer
    await tx.user.update({
      where: { id: buyerId },
      data: { credits: { decrement: prompt.price } },
    });

    // Add credits to seller (minus platform fee - e.g., 10%)
    const platformFee = Math.ceil(prompt.price * 0.1);
    const sellerEarnings = prompt.price - platformFee;

    await tx.user.update({
      where: { id: prompt.userId },
      data: { credits: { increment: sellerEarnings } },
    });

    // Create purchase record
    await tx.promptPurchase.create({
      data: {
        buyerId,
        promptId,
        pricePaid: prompt.price,
      },
    });

    // Update purchase count
    await tx.marketplacePrompt.update({
      where: { id: promptId },
      data: { purchaseCount: { increment: 1 } },
    });

    // Record earnings for seller
    await tx.creatorEarnings.create({
      data: {
        userId: prompt.userId,
        source: "marketplace",
        referenceId: promptId,
        referenceType: "prompt_purchase",
        amount: sellerEarnings,
      },
    });
  });

  // Log credit transaction for buyer (non-blocking)
  logCreditSpend({
    userId: buyerId,
    amount: prompt.price,
    description: `Purchased prompt: ${prompt.title}`,
  }).catch((err) => {
    Logger.error({
      message: "[Marketplace] Failed to log credit spend",
      error: err instanceof Error ? err : undefined,
    });
  });

  Logger.info({
    message: "[Marketplace] Prompt purchased",
    metadata: {
      promptId,
      buyerId,
      sellerId: prompt.userId,
      price: prompt.price,
    },
  });

  return {
    prompt: prompt.prompt,
    negativePrompt: prompt.negativePrompt,
  };
}

/**
 * Check if user has purchased a prompt
 */
export async function hasUserPurchasedPrompt(userId: string, promptId: string): Promise<boolean> {
  const purchase = await prisma.promptPurchase.findUnique({
    where: {
      buyerId_promptId: { buyerId: userId, promptId },
    },
  });

  return !!purchase;
}

/**
 * Get user's purchased prompts
 */
export async function getUserPurchasedPrompts(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return prisma.promptPurchase.findMany({
    where: { buyerId: userId },
    include: {
      prompt: {
        include: {
          user: { select: { id: true, username: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

// ============================================
// REVIEWS
// ============================================

/**
 * Add a review for a purchased prompt
 */
export async function addPromptReview(
  userId: string,
  promptId: string,
  rating: number,
  comment?: string
): Promise<void> {
  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if user has purchased the prompt
  const purchase = await prisma.promptPurchase.findUnique({
    where: {
      buyerId_promptId: { buyerId: userId, promptId },
    },
  });

  if (!purchase) {
    throw new Error("You must purchase the prompt before reviewing");
  }

  // Create or update review
  await prisma.promptReview.upsert({
    where: {
      promptId_userId: { promptId, userId },
    },
    update: {
      rating,
      comment,
    },
    create: {
      promptId,
      userId,
      rating,
      comment,
    },
  });

  // Update average rating
  const reviews = await prisma.promptReview.aggregate({
    where: { promptId },
    _avg: { rating: true },
  });

  await prisma.marketplacePrompt.update({
    where: { id: promptId },
    data: { averageRating: reviews._avg.rating },
  });

  Logger.info({
    message: "[Marketplace] Review added",
    metadata: { promptId, userId, rating },
  });
}

/**
 * Get reviews for a prompt
 */
export async function getPromptReviews(
  promptId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  return prisma.promptReview.findMany({
    where: { promptId },
    include: {
      user: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

// ============================================
// MARKETPLACE DISCOVERY
// ============================================

/**
 * Search and browse marketplace prompts
 */
export async function searchMarketplace(
  params: MarketplaceSearchParams,
  currentUserId?: string
): Promise<{ prompts: MarketplacePromptWithDetails[]; total: number }> {
  const {
    query,
    category,
    tags,
    minPrice,
    maxPrice,
    minRating,
    sortBy = "popular",
    limit = 20,
    offset = 0,
  } = params;

  // Build where clause
  const where = {
    isPublished: true,
    ...(category && { category: category.toLowerCase() }),
    ...(tags && tags.length > 0 && { tags: { hasSome: tags.map((t) => t.toLowerCase()) } }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
    ...(minRating !== undefined && { averageRating: { gte: minRating } }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ],
    }),
  };

  // Build orderBy
  const orderByMap = {
    newest: { createdAt: "desc" as const },
    popular: { purchaseCount: "desc" as const },
    topRated: { averageRating: "desc" as const },
    priceAsc: { price: "asc" as const },
    priceDesc: { price: "desc" as const },
  };

  const [prompts, total] = await Promise.all([
    prisma.marketplacePrompt.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, image: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: orderByMap[sortBy],
      take: limit,
      skip: offset,
    }),
    prisma.marketplacePrompt.count({ where }),
  ]);

  // Check if current user has purchased each prompt
  let purchasedPromptIds: Set<string> = new Set();
  if (currentUserId) {
    const purchases = await prisma.promptPurchase.findMany({
      where: {
        buyerId: currentUserId,
        promptId: { in: prompts.map((p) => p.id) },
      },
      select: { promptId: true },
    });
    purchasedPromptIds = new Set(purchases.map((p) => p.promptId));
  }

  return {
    prompts: prompts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      tags: p.tags,
      price: p.price,
      purchaseCount: p.purchaseCount,
      viewCount: p.viewCount,
      averageRating: p.averageRating,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      createdAt: p.createdAt,
      user: p.user,
      sampleImageIds: p.sampleImageIds,
      reviewCount: p._count.reviews,
      isPurchased: purchasedPromptIds.has(p.id),
    })),
    total,
  };
}

/**
 * Get a single prompt by ID
 */
export async function getMarketplacePrompt(
  promptId: string,
  currentUserId?: string
): Promise<MarketplacePromptWithDetails | null> {
  const prompt = await prisma.marketplacePrompt.findFirst({
    where: { id: promptId, isPublished: true },
    include: {
      user: { select: { id: true, username: true, image: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (!prompt) return null;

  // Increment view count
  await prisma.marketplacePrompt.update({
    where: { id: promptId },
    data: { viewCount: { increment: 1 } },
  });

  // Check if user has purchased
  let isPurchased = false;
  if (currentUserId) {
    isPurchased = await hasUserPurchasedPrompt(currentUserId, promptId);
  }

  return {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    tags: prompt.tags,
    price: prompt.price,
    purchaseCount: prompt.purchaseCount,
    viewCount: prompt.viewCount + 1,
    averageRating: prompt.averageRating,
    isPublished: prompt.isPublished,
    isFeatured: prompt.isFeatured,
    createdAt: prompt.createdAt,
    user: prompt.user,
    sampleImageIds: prompt.sampleImageIds,
    reviewCount: prompt._count.reviews,
    isPurchased,
  };
}

/**
 * Get featured prompts
 */
export async function getFeaturedPrompts(limit: number = 6) {
  return prisma.marketplacePrompt.findMany({
    where: { isPublished: true, isFeatured: true },
    include: {
      user: { select: { id: true, username: true, image: true } },
    },
    orderBy: { purchaseCount: "desc" },
    take: limit,
  });
}

/**
 * Get marketplace categories with counts
 */
export async function getMarketplaceCategories() {
  const categories = await prisma.marketplacePrompt.groupBy({
    by: ["category"],
    where: { isPublished: true },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return categories.map((c) => ({
    name: c.category,
    count: c._count.id,
  }));
}

/**
 * Get popular tags in the marketplace
 */
export async function getMarketplaceTags(limit: number = 20) {
  const prompts = await prisma.marketplacePrompt.findMany({
    where: { isPublished: true },
    select: { tags: true },
  });

  // Count tag occurrences
  const tagCounts = new Map<string, number>();
  for (const prompt of prompts) {
    for (const tag of prompt.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Get user's published prompts
 */
export async function getUserPublishedPrompts(
  userId: string,
  options: { limit?: number; offset?: number; includeUnpublished?: boolean } = {}
) {
  const { limit = 20, offset = 0, includeUnpublished = false } = options;

  return prisma.marketplacePrompt.findMany({
    where: {
      userId,
      ...(includeUnpublished ? {} : { isPublished: true }),
    },
    include: {
      _count: { select: { reviews: true, purchases: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get seller earnings summary
 */
export async function getSellerEarningsSummary(userId: string) {
  const [totalEarnings, totalSales, pendingPayout, recentEarnings] = await Promise.all([
    prisma.creatorEarnings.aggregate({
      where: { userId, source: "marketplace" },
      _sum: { amount: true },
    }),
    prisma.promptPurchase.count({
      where: { prompt: { userId } },
    }),
    prisma.creatorEarnings.aggregate({
      where: { userId, source: "marketplace", isPaidOut: false },
      _sum: { amount: true },
    }),
    prisma.creatorEarnings.findMany({
      where: { userId, source: "marketplace" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    totalEarnings: totalEarnings._sum.amount ?? 0,
    totalSales,
    pendingPayout: pendingPayout._sum.amount ?? 0,
    recentEarnings,
  };
}
