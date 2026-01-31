import { ActionFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { cacheDelete, cacheDeletePattern } from "~/utils/cache.server";
import { Logger } from "~/utils/logger.server";

/**
 * API endpoint to clear all cache entries related to the current user.
 * Only accessible to the logged-in user for their own cache.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    Logger.info({
      message: "Clearing all cache for user",
      metadata: { userId: user.id },
    });

    // Clear all user-related cache keys
    await Promise.all([
      // User login/session data
      cacheDelete(`user-login:${user.id}`),
      // User profile with all pagination variations
      cacheDeletePattern(`user-profile:${user.id}:*`),
      // User follow stats
      cacheDelete(`user-follow-stats:${user.id}`),
      // User collections
      cacheDelete(`user-collections:${user.id}`),
      // User sets with all filter variations
      cacheDeletePattern(`sets:user:${user.id}:*`),
      // User liked images
      cacheDelete(`liked-images:user:${user.id}`),
      // User's following feed with all pagination variations
      cacheDeletePattern(`following-feed:${user.id}:*`),
    ]);

    Logger.info({
      message: "Successfully cleared all cache for user",
      metadata: { userId: user.id },
    });

    return json({ success: true });
  } catch (error) {
    Logger.error({
      message: "Failed to clear user cache",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });
    return json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
};
