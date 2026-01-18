/**
 * =============================================================================
 * GENERATION LOG SERVICE
 * =============================================================================
 *
 * This service manages logging of all image and video generation attempts.
 * Provides transparency for users and debugging capabilities for developers.
 *
 * FEATURES:
 * - Log all generation attempts (success + failure)
 * - Track credit costs and refunds
 * - Link to successful Sets
 * - Store error messages for debugging
 * - Calculate generation duration
 *
 * USAGE:
 *   import { logGenerationStart, logGenerationComplete, logGenerationFailed } from "~/services/generationLog.server";
 *
 *   // At generation start
 *   await logGenerationStart({ requestId, userId, type, prompt, model, creditCost, metadata });
 *
 *   // On success
 *   await logGenerationComplete({ requestId, setId });
 *
 *   // On failure
 *   await logGenerationFailed({ requestId, errorMessage, refundCredits });
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";
import { logCreditSpend, logCreditRefund } from "./creditTransaction.server";

export type GenerationType = "image" | "video";
export type GenerationStatus = "complete" | "failed";

export interface LogGenerationStartParams {
  requestId: string;
  userId: string;
  type: GenerationType;
  prompt: string;
  model: string;
  creditCost: number;
  metadata?: Record<string, unknown>; // Store numberOfImages, style, aspectRatio, duration, etc.
}

export interface LogGenerationCompleteParams {
  requestId: string;
  setId: string;
}

export interface LogGenerationFailedParams {
  requestId: string;
  errorMessage: string;
  refundCredits?: boolean;
}

/**
 * Log the start of a generation request
 * Creates a log entry when generation begins (queued or processing)
 */
export async function logGenerationStart(
  params: LogGenerationStartParams
): Promise<void> {
  const { requestId, userId, type, prompt, model, creditCost, metadata } =
    params;

  try {
    const log = await prisma.generationLog.create({
      data: {
        requestId,
        userId,
        type,
        status: "complete", // Default to complete, will update if fails
        prompt,
        model,
        creditCost,
        metadata: metadata || {},
        createdAt: new Date(),
      },
    });

    // Log credit spending transaction
    await logCreditSpend({
      userId,
      amount: creditCost,
      generationLogId: log.id,
      description: `Spent ${creditCost} credits on ${type} generation`,
      metadata: {
        requestId,
        model,
        type,
      },
    });

    console.log(
      `[GenerationLog] Started logging for request ${requestId} (${type})`
    );
  } catch (error) {
    // Log errors but don't throw - logging failures shouldn't break generation
    console.error(
      `[GenerationLog] Failed to log generation start for ${requestId}:`,
      error
    );
  }
}

/**
 * Mark a generation as complete and link to the resulting Set
 * Call this when generation succeeds
 */
export async function logGenerationComplete(
  params: LogGenerationCompleteParams
): Promise<void> {
  const { requestId, setId } = params;

  try {
    // Find the log entry
    const log = await prisma.generationLog.findUnique({
      where: { requestId },
    });

    if (!log) {
      console.warn(
        `[GenerationLog] No log entry found for request ${requestId}`
      );
      return;
    }

    // Calculate duration
    const createdAt = new Date(log.createdAt);
    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - createdAt.getTime()) / 1000
    );

    // Update the log entry
    await prisma.generationLog.update({
      where: { requestId },
      data: {
        status: "complete",
        setId,
        completedAt,
        duration: durationSeconds,
      },
    });

    console.log(
      `[GenerationLog] Completed logging for request ${requestId}, setId: ${setId}, duration: ${durationSeconds}s`
    );
  } catch (error) {
    console.error(
      `[GenerationLog] Failed to log generation completion for ${requestId}:`,
      error
    );
  }
}

/**
 * Mark a generation as failed and optionally track credit refund
 * Call this when generation fails
 */
export async function logGenerationFailed(
  params: LogGenerationFailedParams
): Promise<void> {
  const { requestId, errorMessage, refundCredits = false } = params;

  try {
    // Find the log entry
    const log = await prisma.generationLog.findUnique({
      where: { requestId },
    });

    if (!log) {
      console.warn(
        `[GenerationLog] No log entry found for request ${requestId}`
      );
      return;
    }

    // Calculate duration
    const createdAt = new Date(log.createdAt);
    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - createdAt.getTime()) / 1000
    );

    // Update the log entry
    await prisma.generationLog.update({
      where: { requestId },
      data: {
        status: "failed",
        errorMessage,
        completedAt,
        duration: durationSeconds,
        creditsRefunded: refundCredits,
      },
    });

    // Log credit refund if applicable
    if (refundCredits) {
      await logCreditRefund({
        userId: log.userId,
        amount: log.creditCost,
        generationLogId: log.id,
        description: `Refunded ${log.creditCost} credits for failed ${log.type} generation`,
      });
    }

    console.log(
      `[GenerationLog] Failed logging for request ${requestId}, error: ${errorMessage}, duration: ${durationSeconds}s, refunded: ${refundCredits}`
    );
  } catch (error) {
    console.error(
      `[GenerationLog] Failed to log generation failure for ${requestId}:`,
      error
    );
  }
}

/**
 * Get generation history for a user
 * Useful for displaying user's generation history in settings
 */
export async function getUserGenerationHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: GenerationType;
    status?: GenerationStatus;
  }
) {
  const { limit = 50, offset = 0, type, status } = options || {};

  try {
    const logs = await prisma.generationLog.findMany({
      where: {
        userId,
        ...(type && { type }),
        ...(status && { status }),
      },
      include: {
        set: {
          include: {
            images: {
              take: 1, // Just get first image for preview
            },
            videos: {
              take: 1, // Just get first video for preview
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return logs;
  } catch (error) {
    console.error(
      `[GenerationLog] Failed to get generation history for user ${userId}:`,
      error
    );
    return [];
  }
}

/**
 * Get generation statistics for a user
 * Useful for analytics and displaying summary stats
 */
export async function getUserGenerationStats(userId: string) {
  try {
    const [totalGenerations, successfulGenerations, failedGenerations, totalCreditsSpent] =
      await Promise.all([
        prisma.generationLog.count({
          where: { userId },
        }),
        prisma.generationLog.count({
          where: { userId, status: "complete" },
        }),
        prisma.generationLog.count({
          where: { userId, status: "failed" },
        }),
        prisma.generationLog.aggregate({
          where: { userId },
          _sum: {
            creditCost: true,
          },
        }),
      ]);

    return {
      totalGenerations,
      successfulGenerations,
      failedGenerations,
      totalCreditsSpent: totalCreditsSpent._sum.creditCost || 0,
      successRate:
        totalGenerations > 0
          ? Math.round((successfulGenerations / totalGenerations) * 100)
          : 0,
    };
  } catch (error) {
    console.error(
      `[GenerationLog] Failed to get generation stats for user ${userId}:`,
      error
    );
    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalCreditsSpent: 0,
      successRate: 0,
    };
  }
}

/**
 * Get a specific generation log by requestId
 * Useful for debugging and displaying detailed error info
 */
export async function getGenerationLogByRequestId(requestId: string) {
  try {
    return await prisma.generationLog.findUnique({
      where: { requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        set: {
          include: {
            images: true,
            videos: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      `[GenerationLog] Failed to get generation log for ${requestId}:`,
      error
    );
    return null;
  }
}
