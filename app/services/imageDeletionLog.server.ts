/**
 * =============================================================================
 * IMAGE DELETION LOG SERVICE
 * =============================================================================
 *
 * This service manages audit logging for image deletions.
 * Preserves a record of deleted images for accountability and historical reference.
 *
 * FEATURES:
 * - Create audit log before image deletion
 * - Preserve original image metadata
 * - Track who deleted the image and why
 * - Query deletion history for admins
 *
 * USAGE:
 *   import { deleteImageWithAudit, getImageDeletionLogs } from "~/services/imageDeletionLog.server";
 *
 *   // Delete with audit trail
 *   await deleteImageWithAudit({ imageId, deletedBy, reason });
 *
 *   // Query deletion history
 *   const logs = await getImageDeletionLogs();
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";
import { deleteImageFromDB, deleteImageFromS3Bucket } from "~/server/deleteImage";

export interface DeleteImageWithAuditParams {
  imageId: string;
  deletedBy: string; // Admin user ID
  reason?: string;
}

export interface DeleteImageResult {
  success: boolean;
  message: string;
  deletionLogId?: string;
  error?: unknown;
}

/**
 * Delete an image with full audit trail
 * Creates an audit log entry before deletion, preserving all image metadata
 */
export async function deleteImageWithAudit(
  params: DeleteImageWithAuditParams
): Promise<DeleteImageResult> {
  const { imageId, deletedBy, reason } = params;

  try {
    // First, fetch the image with all its metadata before deletion
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!image) {
      return {
        success: false,
        message: `Image not found: ${imageId}`,
      };
    }

    // Create the audit log entry with all original image data
    const deletionLog = await prisma.imageDeletionLog.create({
      data: {
        imageId: image.id,
        imageTitle: image.title,
        imagePrompt: image.prompt,
        imageModel: image.model,
        imageUserId: image.userId,
        imageCreatedAt: image.createdAt,
        deletedBy,
        reason,
        metadata: {
          // Preserve all generation parameters
          width: image.width,
          height: image.height,
          quality: image.quality,
          generationStyle: image.generationStyle,
          negativePrompt: image.negativePrompt,
          seed: image.seed,
          cfgScale: image.cfgScale,
          steps: image.steps,
          promptUpsampling: image.promptUpsampling,
          stylePreset: image.stylePreset,
          private: image.private,
          setId: image.setId,
          // Owner info for reference
          ownerUsername: image.user.username,
          ownerEmail: image.user.email,
        },
      },
    });

    console.log(
      `[ImageDeletionLog] Created audit log ${deletionLog.id} for image ${imageId}`
    );

    // Now delete the image from DB
    await deleteImageFromDB(imageId);
    console.log(`[ImageDeletionLog] Deleted image ${imageId} from database`);

    // Delete from S3
    await deleteImageFromS3Bucket(imageId);
    console.log(`[ImageDeletionLog] Deleted image ${imageId} from S3`);

    return {
      success: true,
      message: `Image ${imageId} deleted successfully`,
      deletionLogId: deletionLog.id,
    };
  } catch (error) {
    console.error(
      `[ImageDeletionLog] Failed to delete image ${imageId}:`,
      error
    );
    return {
      success: false,
      message: `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    };
  }
}

/**
 * Get image deletion logs with pagination
 * For admin dashboard to review deleted images
 */
export async function getImageDeletionLogs(options?: {
  limit?: number;
  offset?: number;
  deletedBy?: string;
  imageUserId?: string;
}) {
  const { limit = 50, offset = 0, deletedBy, imageUserId } = options || {};

  try {
    const logs = await prisma.imageDeletionLog.findMany({
      where: {
        ...(deletedBy && { deletedBy }),
        ...(imageUserId && { imageUserId }),
      },
      include: {
        deletedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return logs;
  } catch (error) {
    console.error("[ImageDeletionLog] Failed to get deletion logs:", error);
    return [];
  }
}

/**
 * Get a specific deletion log by ID
 */
export async function getImageDeletionLogById(id: string) {
  try {
    return await prisma.imageDeletionLog.findUnique({
      where: { id },
      include: {
        deletedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      `[ImageDeletionLog] Failed to get deletion log ${id}:`,
      error
    );
    return null;
  }
}

/**
 * Get deletion count statistics
 * Useful for admin dashboards
 */
export async function getImageDeletionStats() {
  try {
    const [totalDeletions, deletionsByAdmin] = await Promise.all([
      prisma.imageDeletionLog.count(),
      prisma.imageDeletionLog.groupBy({
        by: ["deletedBy"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalDeletions,
      deletionsByAdmin,
    };
  } catch (error) {
    console.error("[ImageDeletionLog] Failed to get deletion stats:", error);
    return {
      totalDeletions: 0,
      deletionsByAdmin: [],
    };
  }
}

/**
 * Search deletion logs by original image ID
 * Useful for finding if a specific image was deleted
 */
export async function findDeletionLogByImageId(imageId: string) {
  try {
    return await prisma.imageDeletionLog.findFirst({
      where: { imageId },
      include: {
        deletedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      `[ImageDeletionLog] Failed to find deletion log for image ${imageId}:`,
      error
    );
    return null;
  }
}
