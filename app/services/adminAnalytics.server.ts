/**
 * =============================================================================
 * ADMIN ANALYTICS SERVICE
 * =============================================================================
 *
 * This service provides platform-wide analytics for admin observability.
 * Includes user metrics, credit economy stats, and generation analytics.
 *
 * FEATURES:
 * - User analytics (signups, activity, credit distribution)
 * - Credit economy (purchases, spending, refunds)
 * - Generation metrics (volume, success rates, model usage)
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";

// =============================================================================
// USER ANALYTICS
// =============================================================================

export interface RecentUser {
  id: string;
  username: string;
  email: string;
  image: string | null;
  credits: number;
  createdAt: Date;
  _count: {
    images: number;
    generationLogs: number;
  };
}

/**
 * Get recently signed up users with their credit info and activity
 */
export async function getRecentSignups(limit: number = 20): Promise<RecentUser[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      credits: true,
      createdAt: true,
      _count: {
        select: {
          images: true,
          generationLogs: true,
        },
      },
    },
  });
}

export interface CreditDistribution {
  bucket: string;
  min: number;
  max: number | null;
  count: number;
}

/**
 * Get distribution of users by credit buckets
 */
export async function getCreditDistribution(): Promise<CreditDistribution[]> {
  const buckets = [
    { bucket: "0 credits", min: 0, max: 0 },
    { bucket: "1-10 credits", min: 1, max: 10 },
    { bucket: "11-50 credits", min: 11, max: 50 },
    { bucket: "51-100 credits", min: 51, max: 100 },
    { bucket: "100+ credits", min: 101, max: null },
  ];

  const results = await Promise.all(
    buckets.map(async (bucket) => {
      const count = await prisma.user.count({
        where: {
          credits: {
            gte: bucket.min,
            ...(bucket.max !== null ? { lte: bucket.max } : {}),
          },
        },
      });
      return { ...bucket, count };
    })
  );

  return results;
}

/**
 * Get users with zero credits (potential churn risk)
 */
export async function getZeroCreditUsers(limit: number = 50) {
  return prisma.user.findMany({
    where: { credits: 0 },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      credits: true,
      createdAt: true,
      _count: {
        select: {
          images: true,
          generationLogs: true,
        },
      },
    },
  });
}

/**
 * Get users with most credits (top holders)
 */
export async function getTopCreditHolders(limit: number = 20) {
  return prisma.user.findMany({
    orderBy: { credits: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      credits: true,
      createdAt: true,
      _count: {
        select: {
          images: true,
          generationLogs: true,
        },
      },
    },
  });
}

export interface UserActivityBreakdown {
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  inactive: number;
}

/**
 * Get user activity breakdown by last generation
 */
export async function getUserActivityBreakdown(): Promise<UserActivityBreakdown> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setMonth(monthStart.getMonth() - 1);

  // Get users who generated content in different time ranges
  const [activeToday, activeThisWeek, activeThisMonth, totalUsers] = await Promise.all([
    prisma.user.count({
      where: {
        generationLogs: {
          some: {
            createdAt: { gte: todayStart },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        generationLogs: {
          some: {
            createdAt: { gte: weekStart },
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        generationLogs: {
          some: {
            createdAt: { gte: monthStart },
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    activeToday,
    activeThisWeek,
    activeThisMonth,
    inactive: totalUsers - activeThisMonth,
  };
}

export interface SignupTrend {
  date: string;
  count: number;
}

/**
 * Get daily signup trends for the past N days
 */
export async function getSignupTrends(days: number = 30): Promise<SignupTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const countsByDate: Record<string, number> = {};

  // Initialize all dates with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    countsByDate[dateStr] = 0;
  }

  // Count signups per date
  users.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split("T")[0];
    if (countsByDate[dateStr] !== undefined) {
      countsByDate[dateStr]++;
    }
  });

  return Object.entries(countsByDate).map(([date, count]) => ({
    date,
    count,
  }));
}

// =============================================================================
// CREDIT ECONOMY ANALYTICS
// =============================================================================

export interface CreditFlowSummary {
  totalPurchased: number;
  totalSpent: number;
  totalRefunded: number;
  totalBonuses: number;
  netFlow: number;
  transactionCount: number;
}

/**
 * Get credit flow summary for a time period
 */
export async function getCreditFlowSummary(
  period: "today" | "week" | "month" | "all" = "all"
): Promise<CreditFlowSummary> {
  const now = new Date();
  let startDate: Date | undefined;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate = undefined;
  }

  const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

  const [purchased, spent, refunded, bonuses, transactionCount] = await Promise.all([
    prisma.creditTransaction.aggregate({
      where: { ...whereClause, type: "purchase" },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { ...whereClause, type: "spend" },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { ...whereClause, type: "refund" },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { ...whereClause, type: "bonus" },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.count({ where: whereClause }),
  ]);

  const totalPurchased = purchased._sum.amount || 0;
  const totalSpent = Math.abs(spent._sum.amount || 0);
  const totalRefunded = refunded._sum.amount || 0;
  const totalBonuses = bonuses._sum.amount || 0;

  return {
    totalPurchased,
    totalSpent,
    totalRefunded,
    totalBonuses,
    netFlow: totalPurchased + totalBonuses - totalSpent + totalRefunded,
    transactionCount,
  };
}

export interface CreditTrend {
  date: string;
  purchased: number;
  spent: number;
  refunded: number;
}

/**
 * Get daily credit trends for the past N days
 */
export async function getCreditTrends(days: number = 30): Promise<CreditTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const transactions = await prisma.creditTransaction.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      type: true,
      amount: true,
      createdAt: true,
    },
  });

  // Initialize all dates
  const trendsByDate: Record<string, CreditTrend> = {};
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    trendsByDate[dateStr] = { date: dateStr, purchased: 0, spent: 0, refunded: 0 };
  }

  // Aggregate transactions
  transactions.forEach((tx) => {
    const dateStr = tx.createdAt.toISOString().split("T")[0];
    if (trendsByDate[dateStr]) {
      if (tx.type === "purchase") {
        trendsByDate[dateStr].purchased += tx.amount;
      } else if (tx.type === "spend") {
        trendsByDate[dateStr].spent += Math.abs(tx.amount);
      } else if (tx.type === "refund") {
        trendsByDate[dateStr].refunded += tx.amount;
      }
    }
  });

  return Object.values(trendsByDate);
}

/**
 * Get recent credit transactions for admin view
 */
export async function getRecentCreditTransactions(limit: number = 50) {
  return prisma.creditTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

// =============================================================================
// GENERATION ANALYTICS
// =============================================================================

export interface GenerationStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

/**
 * Get generation statistics for a time period
 */
export async function getGenerationStats(
  period: "today" | "week" | "month" | "all" = "all"
): Promise<GenerationStats> {
  const now = new Date();
  let startDate: Date | undefined;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate = undefined;
  }

  const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

  const [total, successful, failed] = await Promise.all([
    prisma.generationLog.count({ where: whereClause }),
    prisma.generationLog.count({ where: { ...whereClause, status: "complete" } }),
    prisma.generationLog.count({ where: { ...whereClause, status: "failed" } }),
  ]);

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
  };
}

export interface ModelUsage {
  model: string;
  count: number;
  percentage: number;
}

/**
 * Get generation breakdown by AI model
 */
export async function getModelUsageBreakdown(
  period: "today" | "week" | "month" | "all" = "all"
): Promise<ModelUsage[]> {
  const now = new Date();
  let startDate: Date | undefined;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate = undefined;
  }

  const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

  const modelCounts = await prisma.generationLog.groupBy({
    by: ["model"],
    where: whereClause,
    _count: { model: true },
    orderBy: { _count: { model: "desc" } },
  });

  const total = modelCounts.reduce((sum, m) => sum + m._count.model, 0);

  return modelCounts.map((m) => ({
    model: m.model,
    count: m._count.model,
    percentage: total > 0 ? Math.round((m._count.model / total) * 100) : 0,
  }));
}

export interface GenerationTrend {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

/**
 * Get daily generation trends for the past N days
 */
export async function getGenerationTrends(days: number = 30): Promise<GenerationTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const logs = await prisma.generationLog.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      status: true,
      createdAt: true,
    },
  });

  // Initialize all dates
  const trendsByDate: Record<string, GenerationTrend> = {};
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    trendsByDate[dateStr] = { date: dateStr, total: 0, successful: 0, failed: 0 };
  }

  // Aggregate logs
  logs.forEach((log) => {
    const dateStr = log.createdAt.toISOString().split("T")[0];
    if (trendsByDate[dateStr]) {
      trendsByDate[dateStr].total++;
      if (log.status === "complete") {
        trendsByDate[dateStr].successful++;
      } else if (log.status === "failed") {
        trendsByDate[dateStr].failed++;
      }
    }
  });

  return Object.values(trendsByDate);
}

/**
 * Get model-specific success rates
 */
export async function getModelSuccessRates(
  period: "today" | "week" | "month" | "all" = "all"
) {
  const now = new Date();
  let startDate: Date | undefined;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    default:
      startDate = undefined;
  }

  const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

  const [totalByModel, successByModel] = await Promise.all([
    prisma.generationLog.groupBy({
      by: ["model"],
      where: whereClause,
      _count: { model: true },
    }),
    prisma.generationLog.groupBy({
      by: ["model"],
      where: { ...whereClause, status: "complete" },
      _count: { model: true },
    }),
  ]);

  const totalMap = new Map(totalByModel.map((m) => [m.model, m._count.model]));
  const successMap = new Map(successByModel.map((m) => [m.model, m._count.model]));

  return Array.from(totalMap.entries()).map(([model, total]) => {
    const successful = successMap.get(model) || 0;
    return {
      model,
      total,
      successful,
      failed: total - successful,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    };
  });
}

// =============================================================================
// AGGREGATE DASHBOARD STATS
// =============================================================================

export interface AdminDashboardStats {
  totalUsers: number;
  totalImages: number;
  totalVideos: number;
  totalGenerations: number;
  activeUsersToday: number;
  zeroCreditUsers: number;
  creditsInCirculation: number;
}

/**
 * Get aggregate stats for admin dashboard overview
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalImages,
    totalVideos,
    totalGenerations,
    activeUsersToday,
    zeroCreditUsers,
    creditsAggregate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.image.count(),
    prisma.video.count(),
    prisma.generationLog.count(),
    prisma.user.count({
      where: {
        generationLogs: {
          some: {
            createdAt: { gte: todayStart },
          },
        },
      },
    }),
    prisma.user.count({
      where: { credits: 0 },
    }),
    prisma.user.aggregate({
      _sum: { credits: true },
    }),
  ]);

  return {
    totalUsers,
    totalImages,
    totalVideos,
    totalGenerations,
    activeUsersToday,
    zeroCreditUsers,
    creditsInCirculation: creditsAggregate._sum.credits || 0,
  };
}
