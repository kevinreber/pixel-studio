/**
 * Send Tip API
 *
 * POST: Send a tip to a creator
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { sendTip } from "~/services/tipping.server";
import { z } from "zod";

const SendTipSchema = z.object({
  recipientId: z.string().min(1),
  amount: z.coerce.number().min(1).max(1000),
  message: z.string().max(500).optional(),
  imageId: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = SendTipSchema.safeParse(data);
  if (!result.success) {
    return json({ error: "Invalid tip data", details: result.error.flatten() }, { status: 400 });
  }

  try {
    const { tipId } = await sendTip(user.id, result.data);
    return json({ success: true, tipId, message: "Tip sent successfully" });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to send tip" },
      { status: 400 }
    );
  }
}
