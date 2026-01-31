/**
 * Print Orders API
 *
 * GET: Get user's print orders
 * POST: Create a new print order
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services/auth.server";
import {
  getUserOrders,
  createPrintOrder,
  calculateOrderPrice,
} from "~/services/printOnDemand.server";
import { z } from "zod";

const ShippingAddressSchema = z.object({
  name: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().min(2).max(2), // ISO country code
  postalCode: z.string().min(1).max(20),
  phone: z.string().max(20).optional(),
});

const CreateOrderSchema = z.object({
  imageId: z.string().min(1),
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.coerce.number().min(1).max(10),
  shippingAddress: ShippingAddressSchema,
  shippingMethod: z.string().optional(),
});

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  offset: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);

  const result = QuerySchema.safeParse(params);
  const options = result.success ? result.data : {};

  try {
    const orders = await getUserOrders(user.id, options);
    return json({ success: true, orders });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();

    const result = CreateOrderSchema.safeParse(body);
    if (!result.success) {
      return json({ error: "Invalid order data", details: result.error.flatten() }, { status: 400 });
    }

    // Calculate price first
    const pricing = await calculateOrderPrice(
      result.data.productId,
      result.data.size,
      result.data.quantity
    );

    // Create the order
    const { orderId } = await createPrintOrder(user.id, result.data);

    return json({
      success: true,
      orderId,
      pricing,
      message: "Order created successfully",
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 400 }
    );
  }
}
