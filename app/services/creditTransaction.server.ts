/**
 * =============================================================================
 * CREDIT TRANSACTION SERVICE
 * =============================================================================
 *
 * This service manages logging of all credit transactions.
 * Provides complete audit trail for credit purchases, spending, and refunds.
 *
 * FEATURES:
 * - Log all credit additions (purchases, bonuses)
 * - Log all credit spending (image/video generation)
 * - Log credit refunds (failed generations)
 * - Track balance after each transaction
 * - Link to Stripe sessions and generation logs
 *
 * TRANSACTION TYPES:
 * - purchase: Credit purchase via Stripe
 * - spend: Credits spent on generation
 * - refund: Credits refunded for failed generation
 * - admin_adjustment: Manual credit adjustment by admin
 * - bonus: Promotional or welcome bonus credits
 *
 * USAGE:
 *   import { logCreditPurchase, logCreditSpend, logCreditRefund } from "~/services/creditTransaction.server";
 *
 *   // Log purchase
 *   await logCreditPurchase({ userId, amount, stripeSessionId, description, metadata });
 *
 *   // Log spending
 *   await logCreditSpend({ userId, amount, generationLogId, description, metadata });
 *
 *   // Log refund
 *   await logCreditRefund({ userId, amount, generationLogId, description });
 *
 * =============================================================================
 */

import { prisma } from "~/services/prisma.server";

export type TransactionType = "purchase" | "spend" | "refund" | "admin_adjustment" | "bonus";

export interface LogCreditTransactionParams {
  userId: string;
  type: TransactionType;
  amount: number; // Positive for additions, negative for deductions
  description?: string;
  metadata?: Record<string, unknown>;
  stripeSessionId?: string;
  generationLogId?: string;
}

/**
 * Generic function to log any credit transaction
 * Automatically calculates the balance after the transaction
 */
export async function logCreditTransaction(
  params: LogCreditTransactionParams
): Promise<void> {
  const { userId, type, amount, description, metadata, stripeSessionId, generationLogId } = params;

  try {
    // Get current user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      console.error(`[CreditTransaction] User not found: ${userId}`);
      return;
    }

    const balanceAfter = user.credits;

    // Create transaction log
    await prisma.creditTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter,
        description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (metadata || {}) as any,
        stripeSessionId,
        generationLogId,
      },
    });

    console.log(
      `[CreditTransaction] Logged ${type} transaction for user ${userId}: ${amount} credits (balance: ${balanceAfter})`
    );
  } catch (error) {
    // Log errors but don't throw - transaction logging failures shouldn't break the main flow
    console.error(
      `[CreditTransaction] Failed to log ${type} transaction for user ${userId}:`,
      error
    );
  }
}

/**
 * Log a credit purchase (via Stripe)
 */
export async function logCreditPurchase(params: {
  userId: string;
  amount: number;
  stripeSessionId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, amount, stripeSessionId, description, metadata } = params;

  await logCreditTransaction({
    userId,
    type: "purchase",
    amount,
    description: description || `Purchased ${amount} credits`,
    metadata,
    stripeSessionId,
  });
}

/**
 * Log credit spending (image/video generation)
 */
export async function logCreditSpend(params: {
  userId: string;
  amount: number;
  generationLogId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, amount, generationLogId, description, metadata } = params;

  await logCreditTransaction({
    userId,
    type: "spend",
    amount: -Math.abs(amount), // Ensure negative for spending
    description: description || `Spent ${amount} credits on generation`,
    metadata,
    generationLogId,
  });
}

/**
 * Log credit refund (failed generation)
 * This actually restores credits to the user's account and logs the transaction
 */
export async function logCreditRefund(params: {
  userId: string;
  amount: number;
  generationLogId?: string;
  description?: string;
}): Promise<void> {
  const { userId, amount, generationLogId, description } = params;

  const refundAmount = Math.abs(amount);

  try {
    // Actually increment the user's credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: refundAmount,
        },
      },
    });

    // Then log the transaction
    await logCreditTransaction({
      userId,
      type: "refund",
      amount: refundAmount,
      description: description || `Refunded ${amount} credits for failed generation`,
      generationLogId,
    });
  } catch (error) {
    console.error(
      `[CreditTransaction] Failed to refund credits for user ${userId}:`,
      error
    );
    throw error; // Re-throw so callers know the refund failed
  }
}

/**
 * Log admin credit adjustment
 */
export async function logAdminCreditAdjustment(params: {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, amount, description, metadata } = params;

  await logCreditTransaction({
    userId,
    type: "admin_adjustment",
    amount,
    description,
    metadata,
  });
}

/**
 * Log bonus credits (welcome bonus, promotions, etc.)
 */
export async function logBonusCredits(params: {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, amount, description, metadata } = params;

  await logCreditTransaction({
    userId,
    type: "bonus",
    amount: Math.abs(amount), // Ensure positive for bonus
    description,
    metadata,
  });
}

/**
 * Get credit transaction history for a user
 */
export async function getUserCreditTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: TransactionType;
  }
) {
  const { limit = 50, offset = 0, type } = options || {};

  try {
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    return transactions;
  } catch (error) {
    console.error(
      `[CreditTransaction] Failed to get transaction history for user ${userId}:`,
      error
    );
    return [];
  }
}

/**
 * Get credit transaction statistics for a user
 */
export async function getUserCreditStats(userId: string) {
  try {
    const [totalPurchased, totalSpent, totalRefunded, allTransactions] = await Promise.all([
      prisma.creditTransaction.aggregate({
        where: { userId, type: "purchase" },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { userId, type: "spend" },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { userId, type: "refund" },
        _sum: { amount: true },
      }),
      prisma.creditTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      totalPurchased: totalPurchased._sum.amount || 0,
      totalSpent: Math.abs(totalSpent._sum.amount || 0), // Convert to positive for display
      totalRefunded: totalRefunded._sum.amount || 0,
      totalTransactions: allTransactions,
    };
  } catch (error) {
    console.error(
      `[CreditTransaction] Failed to get credit stats for user ${userId}:`,
      error
    );
    return {
      totalPurchased: 0,
      totalSpent: 0,
      totalRefunded: 0,
      totalTransactions: 0,
    };
  }
}

/**
 * Get a specific transaction by ID
 */
export async function getCreditTransactionById(transactionId: string) {
  try {
    return await prisma.creditTransaction.findUnique({
      where: { id: transactionId },
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
  } catch (error) {
    console.error(
      `[CreditTransaction] Failed to get transaction ${transactionId}:`,
      error
    );
    return null;
  }
}
