/**
 * API endpoint to get the status of a specific processing request
 * Used for polling-based status updates
 */

import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { getProcessingStatus } from "~/services/processingStatus.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const requestId = params.requestId;

  if (!requestId) {
    return json({ error: "Request ID is required" }, { status: 400 });
  }

  const status = await getProcessingStatus(requestId);

  if (!status) {
    return json({ error: "Processing request not found" }, { status: 404 });
  }

  return json({
    requestId: status.requestId,
    userId: status.userId,
    status: status.status,
    progress: status.progress,
    message: status.message,
    setId: status.setId,
    images: status.images,
    error: status.error,
    createdAt: status.createdAt,
    updatedAt: status.updatedAt,
  });
};
