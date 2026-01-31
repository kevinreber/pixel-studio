/**
 * =============================================================================
 * LOGIN STREAK SERVICE
 * =============================================================================
 *
 * This service manages daily login tracking and streak bonuses.
 * Users earn credits for logging in daily and maintaining streaks.
 *
 * FEATURES:
 * - Track daily logins
 * - Maintain streak count (consecutive days)
 * - Award daily bonus credits
 * - Award streak milestone bonuses
 * - Track longest streak
 *
 * BONUS STRUCTURE:
 * - Daily login: 1 credit
 * - 7-day streak: +2 bonus credits
 * - 14-day streak: +3 bonus credits
 * - 30-day streak: +5 bonus credits
 *
 * TIMEZONE BEHAVIOR:
 * All date calculations use UTC to ensure consistent behavior across all users
 * regardless of their local timezone. This means:
 * - A "day" resets at midnight UTC (00:00 UTC)
 * - Users in different timezones will see the same reset time (midnight UTC)
 * - Example: A user in PST (UTC-8) can claim their daily bonus after 4:00 PM PST
 *
 * This approach ensures fairness and prevents timezone manipulation, though
 * users may experience the "new day" at different local times.
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";
import { logBonusCredits } from "~/services/creditTransaction.server";

// Bonus credit amounts
const DAILY_LOGIN_BONUS = 1;
const STREAK_BONUSES: Record<number, number> = {
  7: 2,   // 7-day streak bonus
  14: 3,  // 14-day streak bonus
  30: 5,  // 30-day streak bonus
  60: 7,  // 60-day streak bonus
  100: 10, // 100-day streak bonus
};

export interface LoginStreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date | null;
  lastBonusClaimed: Date | null;
  totalDaysLoggedIn: number;
}

export interface DailyBonusResult {
  success: boolean;
  creditsAwarded: number;
  streakBonus: number;
  newStreak: number;
  isNewDay: boolean;
  streakMilestone: number | null;
  message: string;
}

/**
 * Get the start of today in UTC
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Check if two dates are the same day (UTC)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Check if date1 is the day before date2 (consecutive days)
 */
function isConsecutiveDay(previousDate: Date, currentDate: Date): boolean {
  const yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  return isSameDay(previousDate, yesterday);
}

/**
 * Get or create a login streak record for a user
 */
export async function getOrCreateLoginStreak(userId: string): Promise<LoginStreakData> {
  let streak = await prisma.loginStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    streak = await prisma.loginStreak.create({
      data: { userId },
    });
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastLoginDate: streak.lastLoginDate,
    lastBonusClaimed: streak.lastBonusClaimed,
    totalDaysLoggedIn: streak.totalDaysLoggedIn,
  };
}

/**
 * Get user's login streak data
 */
export async function getLoginStreak(userId: string): Promise<LoginStreakData | null> {
  const streak = await prisma.loginStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    return null;
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastLoginDate: streak.lastLoginDate,
    lastBonusClaimed: streak.lastBonusClaimed,
    totalDaysLoggedIn: streak.totalDaysLoggedIn,
  };
}

/**
 * Check if the user can claim their daily bonus
 */
export async function canClaimDailyBonus(userId: string): Promise<boolean> {
  const streak = await prisma.loginStreak.findUnique({
    where: { userId },
    select: { lastBonusClaimed: true },
  });

  if (!streak || !streak.lastBonusClaimed) {
    return true;
  }

  const today = getStartOfToday();
  const lastClaimed = new Date(streak.lastBonusClaimed);

  return !isSameDay(lastClaimed, today);
}

/**
 * Process a daily login and award bonus credits
 * This should be called when a user logs in or visits the app
 *
 * Uses a serializable transaction to prevent race conditions where
 * two simultaneous requests could both claim the daily bonus.
 */
export async function claimDailyBonus(userId: string): Promise<DailyBonusResult> {
  const today = getStartOfToday();

  // Use serializable isolation level to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // Get or create streak record inside transaction
    let streak = await tx.loginStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await tx.loginStreak.create({
        data: { userId },
      });
    }

    // Check if already claimed today (inside transaction to prevent race condition)
    if (streak.lastBonusClaimed && isSameDay(streak.lastBonusClaimed, today)) {
      return {
        success: false,
        creditsAwarded: 0,
        streakBonus: 0,
        newStreak: streak.currentStreak,
        isNewDay: false,
        streakMilestone: null,
        message: "Daily bonus already claimed today",
      };
    }

    // Calculate new streak
    let newStreak = 1;

    if (streak.lastLoginDate) {
      if (isConsecutiveDay(streak.lastLoginDate, today)) {
        // Consecutive day - increment streak
        newStreak = streak.currentStreak + 1;
      } else if (isSameDay(streak.lastLoginDate, today)) {
        // Same day - keep current streak
        newStreak = streak.currentStreak;
      }
      // Otherwise streak resets to 1
    }

    // Calculate bonuses
    let totalCredits = DAILY_LOGIN_BONUS;
    let streakBonus = 0;
    let streakMilestone: number | null = null;

    // Check for streak milestones
    for (const [milestone, bonus] of Object.entries(STREAK_BONUSES)) {
      const milestoneNum = parseInt(milestone);
      if (newStreak === milestoneNum) {
        streakBonus = bonus;
        streakMilestone = milestoneNum;
        totalCredits += bonus;
        break;
      }
    }

    // Update longest streak if needed
    const newLongestStreak = Math.max(streak.longestStreak, newStreak);

    // Update streak record
    await tx.loginStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastLoginDate: today,
        lastBonusClaimed: today,
        totalDaysLoggedIn: streak.totalDaysLoggedIn + 1,
      },
    });

    // Award credits
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: { increment: totalCredits },
      },
    });

    return {
      success: true,
      creditsAwarded: totalCredits,
      streakBonus,
      newStreak,
      isNewDay: true,
      streakMilestone,
      message: streakMilestone
        ? `Congratulations! ${newStreak}-day streak! You earned ${totalCredits} credits!`
        : `Daily bonus claimed! ${newStreak}-day streak. You earned ${totalCredits} credit${totalCredits > 1 ? "s" : ""}!`,
    };
  }, {
    isolationLevel: "Serializable", // Prevent race conditions
  });

  // Log the bonus credit transaction outside the main transaction
  // to avoid extending the serializable transaction duration
  if (result.success) {
    const description = result.streakMilestone
      ? `Daily login bonus (${result.newStreak}-day streak milestone!)`
      : `Daily login bonus (${result.newStreak}-day streak)`;

    await logBonusCredits({
      userId,
      amount: result.creditsAwarded,
      description,
      metadata: {
        type: "daily_login",
        streak: result.newStreak,
        streakMilestone: result.streakMilestone,
        streakBonus: result.streakBonus,
      },
    });
  }

  return result;
}

/**
 * Get streak statistics for a user
 */
export async function getStreakStats(userId: string) {
  const streak = await getOrCreateLoginStreak(userId);
  const canClaim = await canClaimDailyBonus(userId);

  // Calculate next milestone
  let nextMilestone: number | null = null;
  let creditsUntilMilestone = 0;

  for (const milestone of Object.keys(STREAK_BONUSES).map(Number).sort((a, b) => a - b)) {
    if (milestone > streak.currentStreak) {
      nextMilestone = milestone;
      creditsUntilMilestone = milestone - streak.currentStreak;
      break;
    }
  }

  return {
    ...streak,
    canClaimDailyBonus: canClaim,
    nextMilestone,
    daysUntilMilestone: creditsUntilMilestone,
    streakBonuses: STREAK_BONUSES,
  };
}

/**
 * Reset a user's streak (for testing or admin purposes)
 */
export async function resetStreak(userId: string): Promise<void> {
  await prisma.loginStreak.upsert({
    where: { userId },
    create: { userId },
    update: {
      currentStreak: 0,
      lastLoginDate: null,
      lastBonusClaimed: null,
    },
  });
}
