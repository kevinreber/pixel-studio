import {
  type LoaderFunctionArgs,
  json,
  type SerializeFrom,
  MetaFunction,
} from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { getImage } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreImageDetailsPage from "~/pages/ExploreImageDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const imageId = params.imageId || "";
  invariantResponse(imageId, "Image does not exist");

  const image = await getImage(imageId);
  return json({ data: image });
};

export type ExplorePageImageLoader = SerializeFrom<typeof loader>;

export default function Index() {
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore"); // Fallback if there's no history
    }
  };

  return <ExploreImageDetailsPage onClose={handleCloseModal} />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary
        statusHandlers={{
          403: () => <p>You do not have permission</p>,
        404: ({ params }) => (
          <p>Image with id: &quot;{params.imageId}&quot; does not exist</p>
        ),
      }}
      />
    </PageContainer>
  );
};
