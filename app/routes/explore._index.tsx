import { type LoaderFunctionArgs, json, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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

  const data = await getImages(searchTerm, currentPage);

  return json({ data });
};

export type ExplorePageLoader = typeof loader;

export default function Index() {
  const loaderData = useLoaderData<ExplorePageLoader>();
  console.log(loaderData);

  return (
    <>
      <ExplorePage />
    </>
  );
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
