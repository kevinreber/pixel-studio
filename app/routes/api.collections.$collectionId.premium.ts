/**
 * Premium Collection API
 *
 * POST: Make collection premium
 * PUT: Update premium settings
 * DELETE: Remove premium status
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import {
  makeCollectionPremium,
  updatePremiumCollection,
  removeCollectionPremium,
} from "~/services/premiumCollections.server";
import { z } from "zod";

const MakePremiumSchema = z.object({
  price: z.coerce.number().min(1).max(500),
  thumbnail: z.string().url().optional(),
  description: z.string().max(1000).optional(),
});

const UpdatePremiumSchema = z.object({
  price: z.coerce.number().min(1).max(500).optional(),
  thumbnail: z.string().url().optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.coerce.boolean().optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const collectionId = params.collectionId;

  if (!collectionId) {
    return json({ error: "Collection ID required" }, { status: 400 });
  }

  const method = request.method;

  if (method === "POST") {
    // Make collection premium
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const result = MakePremiumSchema.safeParse(data);
    if (!result.success) {
      return json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 });
    }

    try {
      await makeCollectionPremium(user.id, collectionId, result.data.price, {
        thumbnail: result.data.thumbnail,
        description: result.data.description,
      });
      return json({ success: true, message: "Collection is now premium" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to make collection premium" },
        { status: 400 }
      );
    }
  }

  if (method === "PUT") {
    // Update premium settings
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const result = UpdatePremiumSchema.safeParse(data);
    if (!result.success) {
      return json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 });
    }

    try {
      await updatePremiumCollection(user.id, collectionId, result.data);
      return json({ success: true, message: "Premium settings updated" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to update premium settings" },
        { status: 400 }
      );
    }
  }

  if (method === "DELETE") {
    // Remove premium status
    try {
      await removeCollectionPremium(user.id, collectionId);
      return json({ success: true, message: "Premium status removed" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to remove premium status" },
        { status: 400 }
      );
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}
