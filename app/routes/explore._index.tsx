import { defer, type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import ExplorePage from "pages/ExplorePage";
import { getImages, type MediaTypeFilter } from "server/getImages";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { trackSearch } from "~/services/analytics.server";
import { generateMetaTags, SITE_CONFIG } from "~/utils/seo";

export const meta: MetaFunction = () => {
  return generateMetaTags({
    title: "Explore AI Generated Images & Videos",
    description:
      "Discover amazing AI-generated artwork created by our community. Browse images and videos created with DALL-E, Stable Diffusion, Flux, Runway, and more.",
    url: `${SITE_CONFIG.url}/explore`,
    keywords: [
      "AI art gallery",
      "AI generated images",
      "AI artwork",
      "generative art",
      "AI community",
    ],
  });
};

const CACHE_TTL_5_MINUTES = 300;

// Filter options for the UI
export const MEDIA_TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Images", value: "images" },
  { label: "Videos", value: "videos" },
] as const;

export const MODEL_FILTER_OPTIONS = [
  { label: "All Models", value: "" },
  { label: "Stable Diffusion", value: "sd" },
  { label: "DALL-E", value: "dall-e" },
  { label: "Flux", value: "flux" },
  { label: "Ideogram", value: "ideogram" },
  { label: "Runway", value: "runway" },
  { label: "Luma", value: "luma" },
] as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") || 50), 10);
  const mediaType = (searchParams.get("type") || "all") as MediaTypeFilter;
  const model = searchParams.get("model") || "";

  // Track search if user is searching or filtering
  if (searchTerm || mediaType !== "all" || model) {
    trackSearch(user.id, {
      searchTerm: searchTerm || undefined,
      mediaType,
      model: model || undefined,
      page: currentPage,
      pageSize,
    });
  }

  const cacheKey = `explore-images?q=${searchTerm}&page=${currentPage}&pageSize=${pageSize}&type=${mediaType}&model=${model}`;

  // Use defer() to stream data to the client for faster initial page load
  const imagesDataPromise = getCachedDataWithRevalidate(
    cacheKey,
    () =>
      getImages({
        searchTerm,
        page: currentPage,
        pageSize,
        mediaType,
        model,
      }),
    CACHE_TTL_5_MINUTES
  );

  return defer({
    imagesData: imagesDataPromise,
    searchTerm,
    currentPage,
    pageSize,
    mediaType,
    model,
  });
};

export type ExplorePageLoader = typeof loader;

export default function Index() {
  return <ExplorePage />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
