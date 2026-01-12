/**
 * API endpoint to get a user's active image generation jobs
 */

import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { getProcessingStatusService } from "~/services/processingStatus.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const statusService = getProcessingStatusService();
  const allRequests = await statusService.getActiveProcessingRequests();

  // Filter to only this user's requests
  const userRequests = allRequests
    .filter((req) => req.userId === user.id)
    .map((req) => ({
      requestId: req.requestId,
      status: req.status,
      progress: req.progress,
      message: req.message,
      setId: req.setId,
      error: req.error,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return json({
    jobs: userRequests,
    count: userRequests.length,
  });
};
