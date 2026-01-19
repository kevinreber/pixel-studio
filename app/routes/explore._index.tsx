import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import ExplorePage from "pages/ExplorePage";
import { getImages, type MediaTypeFilter } from "server/getImages";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images & Videos" }];
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
  await requireUserLogin(request);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") || 50), 10);
  const mediaType = (searchParams.get("type") || "all") as MediaTypeFilter;
  const model = searchParams.get("model") || "";

  const cacheKey = `explore-images?q=${searchTerm}&page=${currentPage}&pageSize=${pageSize}&type=${mediaType}&model=${model}`;
  const imagesData = getCachedDataWithRevalidate(
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

  return {
    imagesData,
    searchTerm,
    currentPage,
    pageSize,
    mediaType,
    model,
  };
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
