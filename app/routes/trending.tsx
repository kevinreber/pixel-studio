import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PageContainer } from "~/components";
import { TrendingSection } from "~/components/TrendingSection";
import { requireUserLogin } from "~/services";
import { getTrendingContent, type TrendingPeriod } from "~/services/trending.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  return [{ title: "Trending - Pixel Studio" }];
};

const CACHE_TTL_5_MINUTES = 300;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") || "48h") as TrendingPeriod;

  const cacheKey = `trending-page:${period}`;
  const trendingData = await getCachedDataWithRevalidate(
    cacheKey,
    () => getTrendingContent(period),
    CACHE_TTL_5_MINUTES
  );

  return { trendingData, period };
};

export default function TrendingPage() {
  const { trendingData, period } = useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trending</h1>
          <p className="text-zinc-400">
            Discover what&apos;s hot in the community right now
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {(["24h", "48h", "7d", "30d"] as const).map((p) => (
            <a
              key={p}
              href={`/trending?period=${p}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {p === "24h"
                ? "24 Hours"
                : p === "48h"
                  ? "48 Hours"
                  : p === "7d"
                    ? "This Week"
                    : "This Month"}
            </a>
          ))}
        </div>

        <TrendingSection
          initialData={trendingData}
          period={period}
          showImages={true}
          showVideos={true}
          showCreators={true}
          maxItems={20}
        />
      </div>
    </PageContainer>
  );
}
