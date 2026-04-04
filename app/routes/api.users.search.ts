import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { prisma } from "~/services/prisma.server";
import {
  checkRateLimit,
  readLimiter,
  getRateLimitIdentifier,
  rateLimitResponse,
} from "~/services/rateLimit.server";

/**
 * GET /api/users/search?q=username - Search users by username
 * Used for @mention autocomplete in comments.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const rl = await checkRateLimit(
    readLimiter,
    getRateLimitIdentifier(request, user.id)
  );
  if (!rl.success) return rateLimitResponse(rl.reset);

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      NOT: { id: user.id },
    },
    select: {
      id: true,
      username: true,
      image: true,
    },
    take: 8,
    orderBy: { username: "asc" },
  });

  return json({ users });
};
