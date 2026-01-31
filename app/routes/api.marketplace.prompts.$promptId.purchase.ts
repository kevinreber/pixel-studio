/**
 * Prompt Purchase API
 *
 * POST: Purchase a marketplace prompt
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { purchasePrompt } from "~/services/marketplace.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const promptId = params.promptId;

  if (!promptId) {
    return json({ error: "Prompt ID required" }, { status: 400 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const result = await purchasePrompt(user.id, promptId);
    return json({
      success: true,
      message: "Prompt purchased successfully",
      prompt: result.prompt,
      negativePrompt: result.negativePrompt,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to purchase prompt" },
      { status: 400 }
    );
  }
}
