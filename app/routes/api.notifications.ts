import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "~/server/notifications";
import { requireUserLogin } from "~/services";
import { Logger } from "~/utils/logger.server";

/**
 * GET /api/notifications - Get user's notifications
 * Query params:
 *   - limit: number (default 20)
 *   - cursor: string (for pagination)
 *   - unreadOnly: boolean (default false)
 *   - countOnly: boolean (returns only unread count)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const cursor = url.searchParams.get("cursor") || undefined;
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  const countOnly = url.searchParams.get("countOnly") === "true";

  try {
    if (countOnly) {
      const count = await getUnreadNotificationCount(user.id);
      return json({ success: true, count });
    }

    const { notifications, nextCursor } = await getNotifications({
      userId: user.id,
      limit,
      cursor,
      unreadOnly,
    });

    const unreadCount = await getUnreadNotificationCount(user.id);

    return json({
      success: true,
      notifications,
      nextCursor,
      unreadCount,
    });
  } catch (error) {
    Logger.error({
      message: "Error fetching notifications",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });
    return json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
};

/**
 * POST /api/notifications - Mark all notifications as read
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const count = await markAllNotificationsRead(user.id);
    return json({ success: true, count });
  } catch (error) {
    Logger.error({
      message: "Error marking all notifications as read",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id },
    });
    return json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
};
