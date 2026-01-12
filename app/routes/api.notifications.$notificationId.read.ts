import { ActionFunctionArgs, json } from "@remix-run/node";
import { markNotificationRead } from "~/server/notifications";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { Logger } from "~/utils/logger.server";

/**
 * POST /api/notifications/:notificationId/read - Mark a notification as read
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const notificationId = params.notificationId;

  invariantResponse(notificationId, "Notification ID is required");

  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const success = await markNotificationRead({
      notificationId,
      userId: user.id,
    });

    if (!success) {
      return json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return json({ success: true });
  } catch (error) {
    Logger.error({
      message: "Error marking notification as read",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, notificationId },
    });
    return json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
};
