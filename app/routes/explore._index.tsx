import {
  type LoaderFunctionArgs,
  MetaFunction,
  defer,
  type SerializeFrom,
} from "@remix-run/node";
import ExplorePage from "pages/ExplorePage";
import { getImages } from "server/getImages";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import { requireUserLogin } from "~/services";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);

  const imagesPromise = getImages(searchTerm, currentPage);

  return defer({
    images: imagesPromise,
    searchTerm,
    currentPage,
  });
};

export type ExplorePageLoader = SerializeFrom<typeof loader>;

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
