import {
  type LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import SetDetailsPage from "~/pages/SetDetailsPage";
import { getSet } from "~/server/getSet";
import { requireUserLogin } from "~/services";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  // ! TODO: In Remix we currently cannot get deferred data in meta tags.
  // if (!data || !data.data) {
  return [{ title: "Set Details Page" }];
  // }
  // const setData = await data.data;
  // return [
  //   {
  //     title: `Set Details Page for ${setData.prompt.substring(0, 25)}...`,
  //   },
  //   {
  //     name: "description",
  //     content: `Set Details for ${setData.id} - ${setData.prompt}`,
  //   },
  // ];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  const setId = params.setId;
  if (!setId) return redirect("/");
  const cacheKey = `set:${setId}`;

  const setDataPromise = getCachedDataWithRevalidate(cacheKey, () =>
    getSet({ setId })
  );

  return { data: setDataPromise };
};

export type SetPageLoader = typeof loader;

export default function Index() {
  return <SetDetailsPage />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
