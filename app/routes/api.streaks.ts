/**
 * API Routes for Login Streak Management
 *
 * GET /api/streaks - Get user's streak stats
 * POST /api/streaks - Claim daily bonus
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import {
  claimDailyBonus,
  getStreakStats,
} from "~/services/loginStreak.server";
import { checkAndUnlockAchievements } from "~/services/achievements.server";
import { Logger } from "~/utils/logger.server";

/**
 * GET /api/streaks - Get user's streak statistics
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  try {
    const stats = await getStreakStats(user.id);

    return json({
      success: true,
      data: stats,
    });
  } catch (error) {
    Logger.error({
      message: "Error fetching streak stats",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });

    return json(
      { success: false, error: "Failed to fetch streak stats" },
      { status: 500 }
    );
  }
};

/**
 * POST /api/streaks - Claim daily login bonus
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUserLogin(request);

  try {
    const result = await claimDailyBonus(user.id);

    // Check for streak-related achievements if bonus was claimed
    if (result.success) {
      const newAchievements = await checkAndUnlockAchievements(user.id, "streak");

      return json({
        success: true,
        data: {
          ...result,
          newAchievements: newAchievements.filter((a) => a.success).map((a) => a.achievement),
        },
      });
    }

    return json({
      success: true,
      data: result,
    });
  } catch (error) {
    Logger.error({
      message: "Error claiming daily bonus",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });

    return json(
      { success: false, error: "Failed to claim daily bonus" },
      { status: 500 }
    );
  }
};
