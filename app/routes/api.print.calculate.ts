/**
 * Print Price Calculator API
 *
 * POST: Calculate price for a print order
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { calculateOrderPrice } from "~/services/printOnDemand.server";
import { z } from "zod";

const CalculateSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.coerce.number().min(1).max(10),
});

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = CalculateSchema.safeParse(data);
  if (!result.success) {
    return json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const pricing = await calculateOrderPrice(
      result.data.productId,
      result.data.size,
      result.data.quantity
    );

    return json({ success: true, pricing });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to calculate price" },
      { status: 400 }
    );
  }
}
