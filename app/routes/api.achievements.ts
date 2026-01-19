/**
 * API Routes for Achievement Management
 *
 * GET /api/achievements - Get user's achievements and progress
 * POST /api/achievements - Check and unlock achievements
 * POST /api/achievements/seed - Seed achievement definitions (admin)
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import {
  getUserAchievements,
  getAchievementStats,
  checkAndUnlockAchievements,
  seedAchievements,
  getRecentAchievements,
  markAchievementsNotified,
} from "~/services/achievements.server";
import { Logger } from "~/utils/logger.server";

/**
 * GET /api/achievements - Get user's achievements with progress
 * Query params:
 *   - stats: boolean - include stats summary
 *   - unnotified: boolean - get only unnotified achievements
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);
  const includeStats = url.searchParams.get("stats") === "true";
  const unnotifiedOnly = url.searchParams.get("unnotified") === "true";

  try {
    if (unnotifiedOnly) {
      const recentAchievements = await getRecentAchievements(user.id);
      return json({
        success: true,
        data: {
          achievements: recentAchievements.map((ua) => ({
            id: ua.id,
            code: ua.achievement.code,
            name: ua.achievement.name,
            description: ua.achievement.description,
            tier: ua.achievement.tier,
            icon: ua.achievement.icon,
            xpReward: ua.achievement.xpReward,
            creditReward: ua.achievement.creditReward,
            unlockedAt: ua.unlockedAt,
          })),
        },
      });
    }

    const achievements = await getUserAchievements(user.id);

    const response: {
      success: boolean;
      data: {
        achievements: typeof achievements;
        stats?: Awaited<ReturnType<typeof getAchievementStats>>;
      };
    } = {
      success: true,
      data: {
        achievements,
      },
    };

    if (includeStats) {
      const stats = await getAchievementStats(user.id);
      response.data.stats = stats;
    }

    return json(response);
  } catch (error) {
    Logger.error({
      message: "Error fetching achievements",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });

    return json(
      { success: false, error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
};

/**
 * POST /api/achievements - Check and unlock achievements or mark as notified
 * Body:
 *   - action: "check" | "notify" | "seed"
 *   - category?: string (for check action)
 *   - achievementIds?: string[] (for notify action)
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUserLogin(request);

  try {
    const body = await request.json();
    const actionType = body.action || "check";

    switch (actionType) {
      case "check": {
        const category = body.category as string | undefined;
        const results = await checkAndUnlockAchievements(user.id, category);
        const unlocked = results.filter((r) => r.success);

        return json({
          success: true,
          data: {
            checked: true,
            newlyUnlocked: unlocked.length,
            achievements: unlocked.map((r) => r.achievement),
          },
        });
      }

      case "notify": {
        const achievementIds = body.achievementIds as string[];
        if (!achievementIds || !Array.isArray(achievementIds)) {
          return json(
            { success: false, error: "achievementIds array required" },
            { status: 400 }
          );
        }
        await markAchievementsNotified(achievementIds);
        return json({
          success: true,
          data: { notified: achievementIds.length },
        });
      }

      case "seed": {
        // Seed achievements (could be admin-only in production)
        await seedAchievements();
        return json({
          success: true,
          data: { seeded: true },
        });
      }

      default:
        return json(
          { success: false, error: `Unknown action: ${actionType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    Logger.error({
      message: "Error processing achievement action",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });

    return json(
      { success: false, error: "Failed to process achievement action" },
      { status: 500 }
    );
  }
};
