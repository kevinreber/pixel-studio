import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { z } from "zod";
import {
  getUserConversations,
  getOrCreateConversation,
  getUnreadMessageCount,
} from "~/services/messaging.server";
import {
  checkRateLimit,
  readLimiter,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

/**
 * GET /api/messages - Get user's conversations list
 * Query params:
 *   - unreadCount: boolean - only return unread count
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    readLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unreadCount") === "true";

  if (unreadOnly) {
    const count = await getUnreadMessageCount(user.id);
    return json({ success: true, data: { unreadCount: count } });
  }

  const conversations = await getUserConversations(user.id);
  return json({ success: true, data: { conversations } });
};

const StartConversationSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

/**
 * POST /api/messages - Start a new conversation with a user
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const formData = await request.formData();
  const result = StartConversationSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
  });

  if (!result.success) {
    return json({ error: result.error.errors[0].message }, { status: 400 });
  }

  if (result.data.targetUserId === user.id) {
    return json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const conversation = await getOrCreateConversation(
    user.id,
    result.data.targetUserId
  );

  return json({ success: true, data: { conversationId: conversation.id } });
};
