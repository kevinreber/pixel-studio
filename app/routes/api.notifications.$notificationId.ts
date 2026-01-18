import { ActionFunctionArgs, json } from "@remix-run/node";
import { deleteNotification } from "~/server/notifications";
import { requireUserLogin } from "~/services";
import { invariantResponse } from "~/utils";
import { Logger } from "~/utils/logger.server";

/**
 * DELETE /api/notifications/:notificationId - Delete a notification
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const notificationId = params.notificationId;

  invariantResponse(notificationId, "Notification ID is required");

  if (request.method !== "DELETE") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const success = await deleteNotification({
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
      message: "Error deleting notification",
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { userId: user.id, notificationId },
    });
    return json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
};
