/**
 * API Routes for Achievement Management
 *
 * GET /api/achievements - Get user's achievements and progress
 * POST /api/achievements - Check and unlock achievements
 * POST /api/achievements/seed - Seed achievement definitions (admin only)
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import {
  getUserAchievements,
  getAchievementStats,
  checkAndUnlockAchievements,
  seedAchievements,
  getRecentAchievements,
  markAchievementsNotified,
} from "~/services/achievements.server";
import { Logger } from "~/utils/logger.server";

// Zod schema for action body validation
const AchievementActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("check"),
    category: z.string().optional(),
  }),
  z.object({
    action: z.literal("notify"),
    achievementIds: z.array(z.string()).min(1, "achievementIds array required"),
  }),
  z.object({
    action: z.literal("seed"),
  }),
]);

/**
 * Check if user has admin role
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: { name: true },
      },
    },
  });

  return user?.roles.some((role) => role.name === "admin") ?? false;
}

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

    // Validate request body with Zod
    const parseResult = AchievementActionSchema.safeParse(body);
    if (!parseResult.success) {
      return json(
        {
          success: false,
          error: "Invalid request body",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedBody = parseResult.data;

    switch (validatedBody.action) {
      case "check": {
        const results = await checkAndUnlockAchievements(user.id, validatedBody.category);
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
        await markAchievementsNotified(validatedBody.achievementIds);
        return json({
          success: true,
          data: { notified: validatedBody.achievementIds.length },
        });
      }

      case "seed": {
        // Admin-only: Seed achievement definitions
        const isAdmin = await isUserAdmin(user.id);
        if (!isAdmin) {
          return json(
            { success: false, error: "Unauthorized: Admin role required" },
            { status: 403 }
          );
        }

        await seedAchievements();
        return json({
          success: true,
          data: { seeded: true },
        });
      }

      default:
        // TypeScript exhaustiveness check - this should never happen with Zod
        return json(
          { success: false, error: "Unknown action" },
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
