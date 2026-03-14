/**
 * User Analytics Dashboard API
 *
 * GET: Get comprehensive analytics dashboard for the current user
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import { getUserInsightsDashboard } from "~/services/analyticsInsights.server";
import {
  checkRateLimit,
  readLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const rl = await checkRateLimit(
    readLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  try {
    const dashboard = await getUserInsightsDashboard(user.id);
    return json({ success: true, dashboard });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}
