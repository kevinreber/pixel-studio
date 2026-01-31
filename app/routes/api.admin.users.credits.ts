import { ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { requireUserLogin } from "~/services";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { prisma } from "~/services/prisma.server";
import { logAdminCreditAdjustment } from "~/services/creditTransaction.server";

const AdjustCreditsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

/**
 * Admin API endpoint for adjusting user credits
 * Only users with admin role can use this
 *
 * POST /api/admin/users/credits
 * Body: { userId: string, amount: number, reason: string }
 *
 * amount: positive to add credits, negative to remove credits
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const adminUser = await requireUserLogin(request);

  // Check admin permissions
  const adminWithRoles = await getUserWithRoles(adminUser.id);
  if (!isAdmin(adminWithRoles)) {
    return json(
      { error: "You don't have permission to adjust user credits" },
      { status: 403 }
    );
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Parse and validate request body
    const contentType = request.headers.get("content-type");
    let body: unknown;

    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        userId: formData.get("userId"),
        amount: Number(formData.get("amount")),
        reason: formData.get("reason"),
      };
    }

    const validated = AdjustCreditsSchema.parse(body);
    const { userId, amount, reason } = validated;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, credits: true },
    });

    if (!targetUser) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Calculate new balance
    const newBalance = targetUser.credits + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return json(
        {
          error: `Cannot reduce credits below 0. User has ${targetUser.credits} credits, attempted to remove ${Math.abs(amount)}.`,
        },
        { status: 400 }
      );
    }

    // Update user credits
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { credits: newBalance },
      select: { id: true, username: true, credits: true },
    });

    // Log the admin adjustment
    await logAdminCreditAdjustment({
      userId,
      amount,
      description: `Admin adjustment by ${adminUser.username || adminUser.email}: ${reason}`,
      metadata: {
        adminId: adminUser.id,
        adminUsername: adminUser.username,
        reason,
        previousBalance: targetUser.credits,
        newBalance: updatedUser.credits,
      },
    });

    console.log(
      `[AdminCredits] Admin ${adminUser.id} adjusted credits for user ${userId}: ${amount > 0 ? "+" : ""}${amount} (${targetUser.credits} -> ${updatedUser.credits}). Reason: ${reason}`
    );

    return json({
      success: true,
      message: `Successfully ${amount > 0 ? "added" : "removed"} ${Math.abs(amount)} credits ${amount > 0 ? "to" : "from"} ${targetUser.username}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        previousCredits: targetUser.credits,
        newCredits: updatedUser.credits,
      },
    });
  } catch (error) {
    console.error("[AdminCredits] Error:", error);

    if (error instanceof z.ZodError) {
      return json(
        { error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    return json({ error: "Failed to adjust user credits" }, { status: 500 });
  }
};
