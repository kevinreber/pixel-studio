import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { z } from "zod";
import {
  getConversationMessages,
  sendMessage,
} from "~/services/messaging.server";
import {
  checkRateLimit,
  readLimiter,
  writeLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

/**
 * GET /api/messages/:conversationId - Get messages for a conversation
 */
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    readLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const conversationId = params.conversationId;
  if (!conversationId) {
    return json({ error: "Conversation ID required" }, { status: 400 });
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);

  const messages = await getConversationMessages(conversationId, user.id, page);

  if (!messages) {
    return json({ error: "Conversation not found" }, { status: 404 });
  }

  return json({ success: true, data: { messages } });
};

const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

/**
 * POST /api/messages/:conversationId - Send a message
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    writeLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const conversationId = params.conversationId;
  if (!conversationId) {
    return json({ error: "Conversation ID required" }, { status: 400 });
  }

  const formData = await request.formData();
  const result = SendMessageSchema.safeParse({
    content: formData.get("content"),
  });

  if (!result.success) {
    return json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const message = await sendMessage(conversationId, user.id, result.data.content);

  if (!message) {
    return json({ error: "Conversation not found" }, { status: 404 });
  }

  return json({ success: true, data: { message } });
};
