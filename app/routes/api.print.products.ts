/**
 * Print Products API
 *
 * GET: Get available print products
 */

import { json } from "@remix-run/node";
import { getAvailableProducts } from "~/services/printOnDemand.server";

export async function loader() {
  try {
    const products = await getAvailableProducts();
    return json({ success: true, products });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 500 }
    );
  }
}
