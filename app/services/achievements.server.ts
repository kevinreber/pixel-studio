/**
 * =============================================================================
 * ACHIEVEMENTS SERVICE
 * =============================================================================
 *
 * This service manages the achievement/badge system for gamification.
 * Users earn achievements for various activities and milestones.
 *
 * ACHIEVEMENT CATEGORIES:
 * - generation: Image/video generation milestones
 * - social: Followers, following, engagement
 * - streak: Login streak milestones
 * - engagement: Likes, comments, collections
 *
 * ACHIEVEMENT TIERS:
 * - bronze: Easy to achieve
 * - silver: Moderate effort
 * - gold: Significant achievement
 * - platinum: Elite status
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";
import { logBonusCredits } from "~/services/creditTransaction.server";

// Achievement definitions - these will be seeded to the database
export const ACHIEVEMENT_DEFINITIONS = [
  // Generation achievements
  {
    code: "first_generation",
    name: "First Creation",
    description: "Generate your first image",
    category: "generation",
    icon: "sparkles",
    tier: "bronze",
    requirement: 1,
    xpReward: 10,
    creditReward: 1,
  },
  {
    code: "generation_10",
    name: "Getting Started",
    description: "Generate 10 images",
    category: "generation",
    icon: "image",
    tier: "bronze",
    requirement: 10,
    xpReward: 25,
    creditReward: 2,
  },
  {
    code: "generation_50",
    name: "Creative Mind",
    description: "Generate 50 images",
    category: "generation",
    icon: "image",
    tier: "silver",
    requirement: 50,
    xpReward: 50,
    creditReward: 3,
  },
  {
    code: "generation_100",
    name: "Prolific Creator",
    description: "Generate 100 images",
    category: "generation",
    icon: "image",
    tier: "gold",
    requirement: 100,
    xpReward: 100,
    creditReward: 5,
  },
  {
    code: "generation_500",
    name: "Master Artist",
    description: "Generate 500 images",
    category: "generation",
    icon: "crown",
    tier: "platinum",
    requirement: 500,
    xpReward: 250,
    creditReward: 10,
  },

  // Social achievements - Followers
  {
    code: "first_follower",
    name: "First Fan",
    description: "Get your first follower",
    category: "social",
    icon: "user-plus",
    tier: "bronze",
    requirement: 1,
    xpReward: 15,
    creditReward: 1,
  },
  {
    code: "followers_10",
    name: "Rising Star",
    description: "Get 10 followers",
    category: "social",
    icon: "users",
    tier: "silver",
    requirement: 10,
    xpReward: 50,
    creditReward: 3,
  },
  {
    code: "followers_50",
    name: "Community Favorite",
    description: "Get 50 followers",
    category: "social",
    icon: "users",
    tier: "gold",
    requirement: 50,
    xpReward: 100,
    creditReward: 5,
  },
  {
    code: "followers_100",
    name: "Influencer",
    description: "Get 100 followers",
    category: "social",
    icon: "star",
    tier: "platinum",
    requirement: 100,
    xpReward: 200,
    creditReward: 10,
  },

  // Streak achievements
  {
    code: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day login streak",
    category: "streak",
    icon: "flame",
    tier: "bronze",
    requirement: 7,
    xpReward: 25,
    creditReward: 2,
  },
  {
    code: "streak_14",
    name: "Dedicated Creator",
    description: "Maintain a 14-day login streak",
    category: "streak",
    icon: "flame",
    tier: "silver",
    requirement: 14,
    xpReward: 50,
    creditReward: 3,
  },
  {
    code: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day login streak",
    category: "streak",
    icon: "flame",
    tier: "gold",
    requirement: 30,
    xpReward: 100,
    creditReward: 5,
  },
  {
    code: "streak_100",
    name: "Unstoppable",
    description: "Maintain a 100-day login streak",
    category: "streak",
    icon: "trophy",
    tier: "platinum",
    requirement: 100,
    xpReward: 300,
    creditReward: 15,
  },

  // Engagement achievements - Likes received
  {
    code: "likes_received_10",
    name: "Appreciated",
    description: "Receive 10 likes on your images",
    category: "engagement",
    icon: "heart",
    tier: "bronze",
    requirement: 10,
    xpReward: 20,
    creditReward: 1,
  },
  {
    code: "likes_received_50",
    name: "Popular Creator",
    description: "Receive 50 likes on your images",
    category: "engagement",
    icon: "heart",
    tier: "silver",
    requirement: 50,
    xpReward: 50,
    creditReward: 3,
  },
  {
    code: "likes_received_100",
    name: "Crowd Pleaser",
    description: "Receive 100 likes on your images",
    category: "engagement",
    icon: "heart",
    tier: "gold",
    requirement: 100,
    xpReward: 100,
    creditReward: 5,
  },

  // Engagement achievements - Comments
  {
    code: "comments_made_10",
    name: "Conversationalist",
    description: "Leave 10 comments on images",
    category: "engagement",
    icon: "message-circle",
    tier: "bronze",
    requirement: 10,
    xpReward: 15,
    creditReward: 1,
  },
  {
    code: "comments_made_50",
    name: "Active Commenter",
    description: "Leave 50 comments on images",
    category: "engagement",
    icon: "message-circle",
    tier: "silver",
    requirement: 50,
    xpReward: 40,
    creditReward: 2,
  },

  // Collection achievements
  {
    code: "first_collection",
    name: "Curator",
    description: "Create your first collection",
    category: "engagement",
    icon: "folder",
    tier: "bronze",
    requirement: 1,
    xpReward: 10,
    creditReward: 1,
  },
  {
    code: "collections_5",
    name: "Organized Creator",
    description: "Create 5 collections",
    category: "engagement",
    icon: "folder",
    tier: "silver",
    requirement: 5,
    xpReward: 30,
    creditReward: 2,
  },
];

export interface AchievementWithProgress {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  tier: string;
  requirement: number;
  xpReward: number;
  creditReward: number;
  isSecret: boolean;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  progress: number;
  progressPercent: number;
}

export interface UnlockResult {
  success: boolean;
  achievement: {
    code: string;
    name: string;
    description: string;
    tier: string;
    xpReward: number;
    creditReward: number;
  } | null;
  creditsAwarded: number;
  message: string;
}

/**
 * Seed achievement definitions to the database
 * This should be run during app initialization or migration
 */
export async function seedAchievements(): Promise<void> {
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      create: achievement,
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        tier: achievement.tier,
        requirement: achievement.requirement,
        xpReward: achievement.xpReward,
        creditReward: achievement.creditReward,
      },
    });
  }
}

/**
 * Get all achievements with user's progress
 */
export async function getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
  // Get all achievements
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ category: "asc" }, { requirement: "asc" }],
  });

  // Get user's unlocked achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua])
  );

  // Get current progress for each category
  const progress = await calculateUserProgress(userId);

  return achievements.map((achievement) => {
    const userAchievement = unlockedMap.get(achievement.id);
    const currentProgress = getProgressForAchievement(achievement, progress);

    return {
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      tier: achievement.tier,
      requirement: achievement.requirement,
      xpReward: achievement.xpReward,
      creditReward: achievement.creditReward,
      isSecret: achievement.isSecret,
      isUnlocked: !!userAchievement,
      unlockedAt: userAchievement?.unlockedAt ?? null,
      progress: currentProgress,
      progressPercent: Math.min(100, Math.round((currentProgress / achievement.requirement) * 100)),
    };
  });
}

/**
 * Get only unlocked achievements for a user
 */
export async function getUnlockedAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });
}

/**
 * Calculate user's current progress for achievements
 */
async function calculateUserProgress(userId: string) {
  const [
    imageCount,
    followerCount,
    likesReceived,
    commentsMade,
    collectionCount,
    loginStreak,
  ] = await Promise.all([
    prisma.image.count({ where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.imageLike.count({
      where: { image: { userId } },
    }),
    prisma.comment.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.loginStreak.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  return {
    generation: imageCount,
    followers: followerCount,
    likesReceived,
    commentsMade,
    collections: collectionCount,
    streak: loginStreak?.longestStreak ?? 0,
    currentStreak: loginStreak?.currentStreak ?? 0,
  };
}

/**
 * Get the current progress value for a specific achievement
 */
function getProgressForAchievement(
  achievement: { code: string; category: string },
  progress: Awaited<ReturnType<typeof calculateUserProgress>>
): number {
  const code = achievement.code;

  if (code.startsWith("generation") || code === "first_generation") {
    return progress.generation;
  }
  if (code.startsWith("followers") || code === "first_follower") {
    return progress.followers;
  }
  if (code.startsWith("likes_received")) {
    return progress.likesReceived;
  }
  if (code.startsWith("comments_made")) {
    return progress.commentsMade;
  }
  if (code.startsWith("collection") || code === "first_collection") {
    return progress.collections;
  }
  if (code.startsWith("streak")) {
    return progress.streak;
  }

  return 0;
}

/**
 * Check and unlock achievements for a user based on their current progress
 * Returns list of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  userId: string,
  category?: string
): Promise<UnlockResult[]> {
  const results: UnlockResult[] = [];

  // Get user's current progress
  const progress = await calculateUserProgress(userId);

  // Get achievements that haven't been unlocked yet
  const whereClause: { userAchievements?: { none: { userId: string } }; category?: string } = {
    userAchievements: { none: { userId } },
  };
  if (category) {
    whereClause.category = category;
  }

  const unlockedAchievements = await prisma.achievement.findMany({
    where: whereClause,
  });

  for (const achievement of unlockedAchievements) {
    const currentProgress = getProgressForAchievement(achievement, progress);

    if (currentProgress >= achievement.requirement) {
      // Unlock the achievement
      const result = await unlockAchievement(userId, achievement.code);
      if (result.success) {
        results.push(result);
      }
    }
  }

  return results;
}

/**
 * Unlock a specific achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievementCode: string
): Promise<UnlockResult> {
  const achievement = await prisma.achievement.findUnique({
    where: { code: achievementCode },
  });

  if (!achievement) {
    return {
      success: false,
      achievement: null,
      creditsAwarded: 0,
      message: `Achievement ${achievementCode} not found`,
    };
  }

  // Check if already unlocked
  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });

  if (existing) {
    return {
      success: false,
      achievement: null,
      creditsAwarded: 0,
      message: "Achievement already unlocked",
    };
  }

  // Unlock achievement and award credits in transaction
  await prisma.$transaction(async (tx) => {
    // Create user achievement record
    await tx.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        progress: achievement.requirement,
      },
    });

    // Award credits if any
    if (achievement.creditReward > 0) {
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: achievement.creditReward },
        },
      });
    }
  });

  // Log the bonus credit transaction
  if (achievement.creditReward > 0) {
    await logBonusCredits({
      userId,
      amount: achievement.creditReward,
      description: `Achievement unlocked: ${achievement.name}`,
      metadata: {
        type: "achievement",
        achievementCode: achievement.code,
        achievementName: achievement.name,
        tier: achievement.tier,
      },
    });
  }

  return {
    success: true,
    achievement: {
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      tier: achievement.tier,
      xpReward: achievement.xpReward,
      creditReward: achievement.creditReward,
    },
    creditsAwarded: achievement.creditReward,
    message: `Achievement unlocked: ${achievement.name}!`,
  };
}

/**
 * Get achievement stats for a user
 */
export async function getAchievementStats(userId: string) {
  const [totalAchievements, userAchievements, totalXp, totalCredits] = await Promise.all([
    prisma.achievement.count(),
    prisma.userAchievement.count({ where: { userId } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { xpReward: true } } },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { creditReward: true } } },
    }),
  ]);

  const earnedXp = totalXp.reduce((sum, ua) => sum + ua.achievement.xpReward, 0);
  const earnedCredits = totalCredits.reduce((sum, ua) => sum + ua.achievement.creditReward, 0);

  // Count by tier
  const byTier = await prisma.userAchievement.groupBy({
    by: ["achievementId"],
    where: { userId },
  });

  const achievementsWithTier = await prisma.achievement.findMany({
    where: { id: { in: byTier.map((b) => b.achievementId) } },
    select: { tier: true },
  });

  const tierCounts = achievementsWithTier.reduce(
    (acc, a) => {
      acc[a.tier] = (acc[a.tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalAchievements,
    unlockedCount: userAchievements,
    completionPercent: Math.round((userAchievements / totalAchievements) * 100),
    earnedXp,
    earnedCredits,
    tierCounts,
  };
}

/**
 * Get recent achievements (for notifications/display)
 */
export async function getRecentAchievements(userId: string, limit = 5) {
  return prisma.userAchievement.findMany({
    where: { userId, notified: false },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
    take: limit,
  });
}

/**
 * Mark achievements as notified
 */
export async function markAchievementsNotified(achievementIds: string[]): Promise<void> {
  await prisma.userAchievement.updateMany({
    where: { id: { in: achievementIds } },
    data: { notified: true },
  });
}
