/**
 * Analytics & Insights Service
 *
 * Provides comprehensive analytics for users including:
 * - Generation analytics (models, styles, success rates)
 * - Credit usage dashboards
 * - Style fingerprinting
 * - Prompt performance tracking
 */

import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";
import crypto from "crypto";

// ============================================
// TYPES
// ============================================

export interface GenerationStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  successRate: number;
  averageGenerationTime: number;
  totalCreditsSpent: number;
}

export interface ModelUsageStats {
  model: string;
  count: number;
  successRate: number;
  averageTime: number;
}

export interface StyleUsageStats {
  style: string;
  count: number;
  successRate: number;
  averageLikes: number;
}

export interface CreditUsageStats {
  totalSpent: number;
  totalPurchased: number;
  totalEarned: number;
  currentBalance: number;
  spendingByCategory: Record<string, number>;
  recentTransactions: Array<{
    type: string;
    amount: number;
    description: string;
    createdAt: Date;
  }>;
}

export interface PromptPerformanceData {
  promptPreview: string;
  usageCount: number;
  successRate: number;
  averageLikes: number;
  averageComments: number;
  bestModel: string | null;
  lastUsedAt: Date;
}

export interface StyleFingerprintData {
  dominantColors: string[];
  dominantStyles: string[];
  dominantSubjects: string[];
  dominantMoods: string[];
  preferredModels: Record<string, number>;
  commonKeywords: string[];
  diversityScore: number;
  consistencyScore: number;
  experimentalScore: number;
}

export interface UserInsightsDashboard {
  generationStats: GenerationStats;
  modelUsage: ModelUsageStats[];
  styleUsage: StyleUsageStats[];
  creditUsage: CreditUsageStats;
  topPrompts: PromptPerformanceData[];
  styleFingerprint: StyleFingerprintData | null;
  trends: {
    generationsThisWeek: number;
    generationsLastWeek: number;
    likesThisWeek: number;
    likesLastWeek: number;
    newFollowersThisWeek: number;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Hash a prompt for privacy-preserving analytics
 */
function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt.toLowerCase().trim()).digest("hex");
}

/**
 * Get the start of a period (day, week, month)
 */
function getPeriodStart(date: Date, period: "daily" | "weekly" | "monthly"): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  switch (period) {
    case "daily":
      return d;
    case "weekly": {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d;
    }
    case "monthly":
      d.setDate(1);
      return d;
  }
}

// ============================================
// GENERATION ANALYTICS
// ============================================

/**
 * Get generation statistics for a user
 */
export async function getGenerationStats(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<GenerationStats> {
  const { startDate, endDate } = options;

  const whereClause = {
    userId,
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  const [total, successful, failed, avgTime, creditsSpent] = await Promise.all([
    prisma.generationLog.count({ where: whereClause }),
    prisma.generationLog.count({ where: { ...whereClause, status: "complete" } }),
    prisma.generationLog.count({ where: { ...whereClause, status: "failed" } }),
    prisma.generationLog.aggregate({
      where: { ...whereClause, duration: { not: null } },
      _avg: { duration: true },
    }),
    prisma.generationLog.aggregate({
      where: whereClause,
      _sum: { creditCost: true },
    }),
  ]);

  return {
    totalGenerations: total,
    successfulGenerations: successful,
    failedGenerations: failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    averageGenerationTime: avgTime._avg.duration ?? 0,
    totalCreditsSpent: creditsSpent._sum.creditCost ?? 0,
  };
}

/**
 * Get model usage breakdown
 */
export async function getModelUsageStats(userId: string): Promise<ModelUsageStats[]> {
  const logs = await prisma.generationLog.groupBy({
    by: ["model", "status"],
    where: { userId },
    _count: { id: true },
    _avg: { duration: true },
  });

  // Aggregate by model
  const modelMap = new Map<string, { total: number; successful: number; totalTime: number }>();

  for (const log of logs) {
    const existing = modelMap.get(log.model) || { total: 0, successful: 0, totalTime: 0 };
    existing.total += log._count.id;
    if (log.status === "complete") {
      existing.successful += log._count.id;
    }
    existing.totalTime += (log._avg.duration ?? 0) * log._count.id;
    modelMap.set(log.model, existing);
  }

  return Array.from(modelMap.entries())
    .map(([model, stats]) => ({
      model,
      count: stats.total,
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      averageTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get style usage and performance
 */
export async function getStyleUsageStats(userId: string): Promise<StyleUsageStats[]> {
  // Get images with their engagement
  const images = await prisma.image.findMany({
    where: { userId },
    select: {
      stylePreset: true,
      _count: { select: { likes: true } },
    },
  });

  // Aggregate by style
  const styleMap = new Map<string, { count: number; totalLikes: number }>();

  for (const image of images) {
    const style = image.stylePreset || "none";
    const existing = styleMap.get(style) || { count: 0, totalLikes: 0 };
    existing.count++;
    existing.totalLikes += image._count.likes;
    styleMap.set(style, existing);
  }

  // Get success rates from generation logs
  const generationLogs = await prisma.generationLog.findMany({
    where: { userId, type: "image" },
    select: {
      metadata: true,
      status: true,
    },
  });

  const styleSuccessMap = new Map<string, { total: number; successful: number }>();
  for (const log of generationLogs) {
    const metadata = log.metadata as Record<string, unknown> | null;
    const style = (metadata?.style as string) || (metadata?.generationStyle as string) || "none";
    const existing = styleSuccessMap.get(style) || { total: 0, successful: 0 };
    existing.total++;
    if (log.status === "complete") existing.successful++;
    styleSuccessMap.set(style, existing);
  }

  return Array.from(styleMap.entries())
    .map(([style, stats]) => {
      const successStats = styleSuccessMap.get(style) || { total: 1, successful: 1 };
      return {
        style,
        count: stats.count,
        successRate: successStats.total > 0 ? (successStats.successful / successStats.total) * 100 : 100,
        averageLikes: stats.count > 0 ? stats.totalLikes / stats.count : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ============================================
// CREDIT USAGE ANALYTICS
// ============================================

/**
 * Get comprehensive credit usage statistics
 */
export async function getCreditUsageStats(userId: string): Promise<CreditUsageStats> {
  const [user, transactions, spendingByType] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    }),
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.creditTransaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const spendingByCategory: Record<string, number> = {};
  let totalSpent = 0;
  let totalPurchased = 0;
  let totalEarned = 0;

  for (const item of spendingByType) {
    const amount = Math.abs(item._sum.amount ?? 0);
    spendingByCategory[item.type] = amount;

    if (item.type === "spend") {
      totalSpent = amount;
    } else if (item.type === "purchase") {
      totalPurchased = amount;
    } else if (item.type === "bonus" || item.type === "refund") {
      totalEarned += item._sum.amount ?? 0;
    }
  }

  return {
    totalSpent,
    totalPurchased,
    totalEarned,
    currentBalance: user?.credits ?? 0,
    spendingByCategory,
    recentTransactions: transactions,
  };
}

/**
 * Get credit spending over time
 */
export async function getCreditSpendingTimeline(
  userId: string,
  days: number = 30
): Promise<Array<{ date: string; spent: number; earned: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      type: true,
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailyData = new Map<string, { spent: number; earned: number }>();

  for (const tx of transactions) {
    const dateKey = tx.createdAt.toISOString().split("T")[0];
    const existing = dailyData.get(dateKey) || { spent: 0, earned: 0 };

    if (tx.type === "spend") {
      existing.spent += Math.abs(tx.amount);
    } else if (tx.amount > 0) {
      existing.earned += tx.amount;
    }

    dailyData.set(dateKey, existing);
  }

  return Array.from(dailyData.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================
// PROMPT PERFORMANCE ANALYTICS
// ============================================

/**
 * Track and update prompt analytics
 */
export async function trackPromptUsage(
  userId: string,
  prompt: string,
  success: boolean,
  model?: string,
  style?: string
): Promise<void> {
  const promptHash = hashPrompt(prompt);
  const promptPreview = prompt.slice(0, 50);

  try {
    await prisma.promptAnalytics.upsert({
      where: {
        userId_promptHash: { userId, promptHash },
      },
      update: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        // Update success rate (weighted average)
        successRate: {
          // This is a simplified approach - for production, calculate properly
          set: success ? 100 : 0,
        },
        ...(success && model ? { bestModel: model } : {}),
        ...(success && style ? { bestStyle: style } : {}),
      },
      create: {
        userId,
        promptHash,
        promptPreview,
        usageCount: 1,
        successRate: success ? 100 : 0,
        bestModel: model,
        bestStyle: style,
      },
    });
  } catch (error) {
    Logger.error({
      message: "[AnalyticsInsights] Error tracking prompt usage",
      error,
      metadata: { userId, promptHash },
    });
  }
}

/**
 * Get top performing prompts for a user
 */
export async function getTopPrompts(
  userId: string,
  options: {
    limit?: number;
    sortBy?: "usageCount" | "totalLikes" | "successRate";
  } = {}
): Promise<PromptPerformanceData[]> {
  const { limit = 10, sortBy = "usageCount" } = options;

  const prompts = await prisma.promptAnalytics.findMany({
    where: { userId },
    orderBy: { [sortBy]: "desc" },
    take: limit,
  });

  return prompts.map((p) => ({
    promptPreview: p.promptPreview || "N/A",
    usageCount: p.usageCount,
    successRate: p.successRate,
    averageLikes: p.totalLikes / Math.max(p.usageCount, 1),
    averageComments: p.totalComments / Math.max(p.usageCount, 1),
    bestModel: p.bestModel,
    lastUsedAt: p.lastUsedAt,
  }));
}

/**
 * Update prompt engagement metrics when an image receives likes/comments
 */
export async function updatePromptEngagement(
  userId: string,
  prompt: string,
  likes: number,
  comments: number
): Promise<void> {
  const promptHash = hashPrompt(prompt);

  try {
    await prisma.promptAnalytics.update({
      where: {
        userId_promptHash: { userId, promptHash },
      },
      data: {
        totalLikes: { increment: likes },
        totalComments: { increment: comments },
      },
    });
  } catch {
    // Prompt analytics might not exist yet, ignore
  }
}

// ============================================
// STYLE FINGERPRINT
// ============================================

/**
 * Compute and update a user's style fingerprint
 */
export async function computeStyleFingerprint(userId: string): Promise<StyleFingerprintData> {
  // Get all user's images with their tags and attributes
  const images = await prisma.image.findMany({
    where: { userId },
    include: {
      tags: true,
      attributes: true,
    },
  });

  // Get generation logs for model preferences
  const generationLogs = await prisma.generationLog.findMany({
    where: { userId, type: "image", status: "complete" },
    select: { model: true },
  });

  // Aggregate attributes by category
  const colorCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const subjectCounts = new Map<string, number>();
  const moodCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();

  for (const image of images) {
    for (const attr of image.attributes) {
      const map =
        attr.category === "color"
          ? colorCounts
          : attr.category === "style"
            ? styleCounts
            : attr.category === "subject"
              ? subjectCounts
              : attr.category === "mood"
                ? moodCounts
                : null;

      if (map) {
        map.set(attr.value, (map.get(attr.value) || 0) + attr.confidence);
      }
    }

    // Extract keywords from tags
    for (const tag of image.tags) {
      keywordCounts.set(tag.tag, (keywordCounts.get(tag.tag) || 0) + tag.confidence);
    }
  }

  // Calculate model preferences
  const modelCounts = new Map<string, number>();
  for (const log of generationLogs) {
    modelCounts.set(log.model, (modelCounts.get(log.model) || 0) + 1);
  }
  const totalGenerations = generationLogs.length;
  const preferredModels: Record<string, number> = {};
  for (const [model, count] of modelCounts) {
    preferredModels[model] = totalGenerations > 0 ? count / totalGenerations : 0;
  }

  // Helper to get top N from a map
  const getTopN = (map: Map<string, number>, n: number): string[] =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);

  // Calculate scores
  const uniqueStyles = new Set(images.map((i) => i.stylePreset)).size;
  const uniqueModels = modelCounts.size;
  const totalImages = images.length;

  const diversityScore = Math.min(
    1,
    (uniqueStyles + uniqueModels) / Math.max(10, totalImages * 0.5)
  );

  // Consistency: how often they stick to their top choices
  const topStyle = getTopN(styleCounts, 1)[0];
  const topStyleCount = styleCounts.get(topStyle) || 0;
  const consistencyScore = totalImages > 0 ? topStyleCount / totalImages : 0;

  // Experimental: variety in recent generations
  const recentLogs = generationLogs.slice(-20);
  const recentModels = new Set(recentLogs.map((l) => l.model)).size;
  const experimentalScore = recentLogs.length > 0 ? recentModels / Math.min(5, recentLogs.length) : 0;

  const fingerprint: StyleFingerprintData = {
    dominantColors: getTopN(colorCounts, 5),
    dominantStyles: getTopN(styleCounts, 5),
    dominantSubjects: getTopN(subjectCounts, 5),
    dominantMoods: getTopN(moodCounts, 5),
    preferredModels,
    commonKeywords: getTopN(keywordCounts, 10),
    diversityScore: Math.round(diversityScore * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    experimentalScore: Math.round(experimentalScore * 100) / 100,
  };

  // Store the fingerprint
  await prisma.styleFingerprint.upsert({
    where: { userId },
    update: {
      dominantColors: fingerprint.dominantColors,
      dominantStyles: fingerprint.dominantStyles,
      dominantSubjects: fingerprint.dominantSubjects,
      dominantMoods: fingerprint.dominantMoods,
      preferredModels: fingerprint.preferredModels,
      commonKeywords: fingerprint.commonKeywords,
      diversityScore: fingerprint.diversityScore,
      consistencyScore: fingerprint.consistencyScore,
      experimentalScore: fingerprint.experimentalScore,
      computedAt: new Date(),
    },
    create: {
      userId,
      dominantColors: fingerprint.dominantColors,
      dominantStyles: fingerprint.dominantStyles,
      dominantSubjects: fingerprint.dominantSubjects,
      dominantMoods: fingerprint.dominantMoods,
      preferredModels: fingerprint.preferredModels,
      commonKeywords: fingerprint.commonKeywords,
      diversityScore: fingerprint.diversityScore,
      consistencyScore: fingerprint.consistencyScore,
      experimentalScore: fingerprint.experimentalScore,
    },
  });

  return fingerprint;
}

/**
 * Get a user's style fingerprint (from cache or compute)
 */
export async function getStyleFingerprint(userId: string): Promise<StyleFingerprintData | null> {
  const fingerprint = await prisma.styleFingerprint.findUnique({
    where: { userId },
  });

  if (!fingerprint) {
    return null;
  }

  return {
    dominantColors: (fingerprint.dominantColors as string[]) || [],
    dominantStyles: (fingerprint.dominantStyles as string[]) || [],
    dominantSubjects: (fingerprint.dominantSubjects as string[]) || [],
    dominantMoods: (fingerprint.dominantMoods as string[]) || [],
    preferredModels: (fingerprint.preferredModels as Record<string, number>) || {},
    commonKeywords: (fingerprint.commonKeywords as string[]) || [],
    diversityScore: fingerprint.diversityScore ?? 0,
    consistencyScore: fingerprint.consistencyScore ?? 0,
    experimentalScore: fingerprint.experimentalScore ?? 0,
  };
}

// ============================================
// USER ANALYTICS AGGREGATION
// ============================================

/**
 * Aggregate and store user analytics for a period
 */
export async function aggregateUserAnalytics(
  userId: string,
  period: "daily" | "weekly" | "monthly"
): Promise<void> {
  const now = new Date();
  const periodStart = getPeriodStart(now, period);

  // Calculate various stats for the period
  const [genStats, creditStats, engagementReceived, engagementGiven, followers] = await Promise.all([
    // Generation stats
    prisma.generationLog.aggregate({
      where: {
        userId,
        createdAt: { gte: periodStart },
      },
      _count: { id: true },
      _avg: { duration: true },
      _sum: { creditCost: true },
    }),
    // Credit transactions
    prisma.creditTransaction.groupBy({
      by: ["type"],
      where: {
        userId,
        createdAt: { gte: periodStart },
      },
      _sum: { amount: true },
    }),
    // Engagement received
    Promise.all([
      prisma.imageLike.count({
        where: {
          image: { userId },
          // Can't filter by date on likes easily, so this is approximate
        },
      }),
      prisma.comment.count({
        where: {
          image: { userId },
          createdAt: { gte: periodStart },
        },
      }),
    ]),
    // Engagement given
    Promise.all([
      prisma.imageLike.count({
        where: {
          userId,
          // Approximate
        },
      }),
      prisma.comment.count({
        where: {
          userId,
          createdAt: { gte: periodStart },
        },
      }),
    ]),
    // New followers
    prisma.follow.count({
      where: {
        followingId: userId,
        createdAt: { gte: periodStart },
      },
    }),
  ]);

  // Parse credit stats
  let creditsSpent = 0;
  let creditsPurchased = 0;
  let creditsEarned = 0;
  for (const stat of creditStats) {
    const amount = stat._sum.amount ?? 0;
    if (stat.type === "spend") creditsSpent = Math.abs(amount);
    else if (stat.type === "purchase") creditsPurchased = amount;
    else if (stat.type === "bonus" || stat.type === "refund") creditsEarned += amount;
  }

  // Get model and style usage
  const generations = await prisma.generationLog.findMany({
    where: {
      userId,
      createdAt: { gte: periodStart },
    },
    select: {
      model: true,
      metadata: true,
      status: true,
    },
  });

  const modelUsage: Record<string, number> = {};
  const styleUsage: Record<string, number> = {};
  let successful = 0;
  let failed = 0;

  for (const gen of generations) {
    modelUsage[gen.model] = (modelUsage[gen.model] || 0) + 1;
    const metadata = gen.metadata as Record<string, unknown> | null;
    const style = (metadata?.style as string) || "default";
    styleUsage[style] = (styleUsage[style] || 0) + 1;
    if (gen.status === "complete") successful++;
    else if (gen.status === "failed") failed++;
  }

  // Upsert analytics record
  await prisma.userAnalytics.upsert({
    where: {
      userId_period_date: { userId, period, date: periodStart },
    },
    update: {
      totalGenerations: genStats._count.id,
      successfulGenerations: successful,
      failedGenerations: failed,
      averageGenerationTime: Math.round(genStats._avg.duration ?? 0),
      creditsSpent,
      creditsPurchased,
      creditsEarned,
      modelUsage,
      styleUsage,
      likesReceived: engagementReceived[0],
      commentsReceived: engagementReceived[1],
      followersGained: followers,
      likesGiven: engagementGiven[0],
      commentsGiven: engagementGiven[1],
    },
    create: {
      userId,
      period,
      date: periodStart,
      totalGenerations: genStats._count.id,
      successfulGenerations: successful,
      failedGenerations: failed,
      averageGenerationTime: Math.round(genStats._avg.duration ?? 0),
      creditsSpent,
      creditsPurchased,
      creditsEarned,
      modelUsage,
      styleUsage,
      likesReceived: engagementReceived[0],
      commentsReceived: engagementReceived[1],
      followersGained: followers,
      likesGiven: engagementGiven[0],
      commentsGiven: engagementGiven[1],
    },
  });

  Logger.info({
    message: "[AnalyticsInsights] User analytics aggregated",
    metadata: { userId, period, periodStart: periodStart.toISOString() },
  });
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Get comprehensive user insights dashboard
 */
export async function getUserInsightsDashboard(userId: string): Promise<UserInsightsDashboard> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    generationStats,
    modelUsage,
    styleUsage,
    creditUsage,
    topPrompts,
    styleFingerprint,
    generationsThisWeek,
    generationsLastWeek,
    likesThisWeek,
    likesLastWeek,
    newFollowersThisWeek,
  ] = await Promise.all([
    getGenerationStats(userId),
    getModelUsageStats(userId),
    getStyleUsageStats(userId),
    getCreditUsageStats(userId),
    getTopPrompts(userId, { limit: 5 }),
    getStyleFingerprint(userId),
    prisma.generationLog.count({
      where: { userId, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.generationLog.count({
      where: { userId, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } },
    }),
    prisma.imageLike.count({
      where: { image: { userId } },
    }),
    // This is approximate since we don't have date on likes
    prisma.imageLike.count({
      where: { image: { userId } },
    }),
    prisma.follow.count({
      where: { followingId: userId, createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  return {
    generationStats,
    modelUsage,
    styleUsage,
    creditUsage,
    topPrompts,
    styleFingerprint,
    trends: {
      generationsThisWeek,
      generationsLastWeek,
      likesThisWeek,
      likesLastWeek,
      newFollowersThisWeek,
    },
  };
}

/**
 * Get analytics history for a user
 */
export async function getUserAnalyticsHistory(
  userId: string,
  period: "daily" | "weekly" | "monthly",
  limit: number = 12
) {
  return prisma.userAnalytics.findMany({
    where: { userId, period },
    orderBy: { date: "desc" },
    take: limit,
  });
}
