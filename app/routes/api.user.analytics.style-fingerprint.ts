/**
 * Style Fingerprint API
 *
 * GET: Get user's style fingerprint
 * POST: Recompute style fingerprint
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { getStyleFingerprint, computeStyleFingerprint } from "~/services/analyticsInsights.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  try {
    const fingerprint = await getStyleFingerprint(user.id);
    return json({ success: true, fingerprint });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load style fingerprint" },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const fingerprint = await computeStyleFingerprint(user.id);
    return json({ success: true, fingerprint });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to compute style fingerprint" },
      { status: 500 }
    );
  }
}
