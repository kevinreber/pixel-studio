import {
  type LoaderFunctionArgs,
  json,
  type SerializeFrom,
  MetaFunction,
} from "@remix-run/node";
import { getImage } from "~/server";
import { GeneralErrorBoundary } from "~/components";
import { invariantResponse } from "~/utils";

export const meta: MetaFunction = () => {
  return [{ title: "Image Details Page" }];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const imageId = params.imageId || "";
  invariantResponse(imageId, "Image does not exist");

  const image = await getImage(imageId);

  return json({ data: image });
};

export type ImageDetailsPageImageLoader = SerializeFrom<typeof loader>;

export const ErrorBoundary = () => {
  return (
    <GeneralErrorBoundary
      statusHandlers={{
        403: () => <p>You do not have permission</p>,
        404: ({ params }) => (
          <p>Image with id: &quot;{params.imageId}&quot; does not exist</p>
        ),
      }}
    />
  );
};
