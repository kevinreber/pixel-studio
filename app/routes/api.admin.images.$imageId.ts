import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireUserLogin } from "~/services";
import { canDeleteAnyImage, getUserWithRoles } from "~/server/isAdmin.server";
import { deleteImageWithAudit } from "~/services/imageDeletionLog.server";

// CUID format validation regex
const CUID_REGEX = /^c[^\s-]{24,}$/;

const DeleteImageSchema = z.object({
  reason: z.string().optional(),
});

/**
 * Admin API endpoint for deleting images
 * Only users with admin role or "delete image any" permission can use this
 *
 * DELETE /api/admin/images/:imageId
 * Body: { reason?: string }
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const imageId = params.imageId;

  // Validate imageId exists and is valid CUID format
  if (!imageId || !CUID_REGEX.test(imageId)) {
    return json(
      { error: "Invalid image ID format" },
      { status: 400 }
    );
  }

  // Fetch user with roles to check permissions
  const userWithRoles = await getUserWithRoles(user.id);

  // Check if user has admin permissions to delete any image
  if (!canDeleteAnyImage(userWithRoles)) {
    return json(
      { error: "You don't have permission to delete images" },
      { status: 403 }
    );
  }

  switch (request.method) {
    case "DELETE": {
      try {
        // Parse optional reason from request body
        let reason: string | undefined;
        const contentType = request.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const body = await request.json();
          const validated = DeleteImageSchema.parse(body);
          reason = validated.reason;
        } else if (contentType?.includes("application/x-www-form-urlencoded") || contentType?.includes("multipart/form-data")) {
          const formData = await request.formData();
          const reasonValue = formData.get("reason");
          if (reasonValue && typeof reasonValue === "string") {
            reason = reasonValue;
          }
        }

        // Delete the image with audit trail
        const result = await deleteImageWithAudit({
          imageId,
          deletedBy: user.id,
          reason,
        });

        if (!result.success) {
          return json(
            { error: result.message },
            { status: result.message.includes("not found") ? 404 : 500 }
          );
        }

        return json({
          success: true,
          message: result.message,
          deletionLogId: result.deletionLogId,
        });
      } catch (error) {
        console.error("[AdminImageDelete] Error:", error);

        if (error instanceof z.ZodError) {
          return json({ error: "Invalid request data" }, { status: 400 });
        }

        // Handle Prisma-specific errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            return json({ error: "Image not found" }, { status: 404 });
          }
          if (error.code === "P2003") {
            return json({ error: "Cannot delete: image has dependencies" }, { status: 409 });
          }
        }

        return json(
          { error: "Failed to delete image" },
          { status: 500 }
        );
      }
    }

    default:
      return json({ error: "Method not allowed" }, { status: 405 });
  }
};
