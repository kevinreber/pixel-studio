import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import ExplorePage from "pages/ExplorePage";
import { getImages } from "server/getImages";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

const CACHE_TTL_5_MINUTES = 300;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);

  const cacheKey = `explore-images?q=${searchTerm}&page=${currentPage}`;
  const images = getCachedDataWithRevalidate(
    cacheKey,
    () => getImages(searchTerm, currentPage),
    CACHE_TTL_5_MINUTES
  );

  return {
    images,
    searchTerm,
    currentPage,
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
