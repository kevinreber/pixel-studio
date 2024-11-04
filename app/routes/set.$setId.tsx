import {
  type LoaderFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
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
  const loaderData = useLoaderData<SetPageLoader>();
  const setImages = loaderData.data?.images || [];
  console.log("*****************Set Images: ", setImages);

  const setId = useParams().setId;

  return (
    <>
      <h1>Set {setId}</h1>
      {/* {setImages.map((image) => (
        <div key={image.id}>{image.prompt}</div>
      ))} */}
    </>
  );
}
