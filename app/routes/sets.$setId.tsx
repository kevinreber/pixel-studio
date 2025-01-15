import {
  type LoaderFunctionArgs,
  defer,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import SetDetailsPage from "~/pages/SetDetailsPage";
import { getSet } from "~/server/getSet";
import { requireUserLogin } from "~/services";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Set Details Page" }];
  }
  const setData = data.data[0];
  return [
    { title: `Set Details - ${setData.prompt.substring(0, 50)}...` },
    { description: setData.prompt },
  ];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  const setId = params.setId;

  if (!setId) {
    return redirect("/");
  }

  const setDataPromise = getSet({ setId });

  return defer({
    data: setDataPromise,
  });
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
