/**
 * Marketplace Prompts API
 *
 * GET: Search/browse marketplace prompts
 * POST: Publish a new prompt
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin, getUserFromRequest } from "~/services/auth.server";
import { searchMarketplace, publishPrompt } from "~/services/marketplace.server";
import { z } from "zod";

const SearchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  sortBy: z.enum(["newest", "popular", "topRated", "priceAsc", "priceDesc"]).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const PublishPromptSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  prompt: z.string().min(1).max(5000),
  negativePrompt: z.string().max(2000).optional(),
  category: z.string().min(1).max(50),
  tags: z.string(), // comma-separated
  price: z.coerce.number().min(1).max(1000),
  recommendedModel: z.string().optional(),
  recommendedStyle: z.string().optional(),
  sampleImageIds: z.string().optional(), // comma-separated
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);

  const result = SearchParamsSchema.safeParse(searchParams);
  if (!result.success) {
    return json({ error: "Invalid search parameters" }, { status: 400 });
  }

  // Get current user if logged in
  const user = await getUserFromRequest(request);

  try {
    const { prompts, total } = await searchMarketplace(
      {
        ...result.data,
        tags: result.data.tags?.split(",").filter(Boolean),
      },
      user?.id
    );

    return json({ success: true, prompts, total });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to search marketplace" },
      { status: 500 }
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = PublishPromptSchema.safeParse(data);
  if (!result.success) {
    return json({ error: "Invalid prompt data", details: result.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await publishPrompt(user.id, {
      ...result.data,
      tags: result.data.tags.split(",").map((t) => t.trim()).filter(Boolean),
      sampleImageIds: result.data.sampleImageIds?.split(",").filter(Boolean),
    });

    return json({ success: true, promptId: id });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to publish prompt" },
      { status: 400 }
    );
  }
}
