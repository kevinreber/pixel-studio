import {
  type LoaderFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import SetDetailsPage from "~/pages/SetDetailsPage";
import { getSet } from "~/server/getSet";
import { requireUserLogin } from "~/services";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  const setId = params.setId;

  if (!setId) {
    return redirect("/");
  }

  const data = await getSet({ setId });

  return json({ data });
};

export type SetPageLoader = typeof loader;

export default function Index() {
  return (
    <>
      <SetDetailsPage />
    </>
  );
}
