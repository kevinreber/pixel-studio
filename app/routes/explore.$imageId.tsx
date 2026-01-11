import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { getImage } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreImageDetailsPage from "~/pages/ExploreImageDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";
import { requireUserLogin } from "~/services";
import { getImageCollection } from "~/server/getImageCollection";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";

export const meta: MetaFunction = () => {
  return [{ title: "Explore AI Generated Images" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const imageId = params.imageId || "";
  invariantResponse(imageId, "Image does not exist");

  // Try to get user, but don't require login
  let user: { id: string } | null = null;
  try {
    user = await requireUserLogin(request);
  } catch {
    // User is not logged in, which is fine
  }

  const imageDetailsCacheKey = `image-details:${imageId}`;
  const imagePromise = getCachedDataWithRevalidate(imageDetailsCacheKey, () =>
    getImage(imageId)
  );

  // TODO: Verify if we need to cache this after we create Collections Page
  const collectionsCacheKey = `user-collections:${user?.id}`;
  const collectionsPromise = getCachedDataWithRevalidate(
    collectionsCacheKey,
    () => getImageCollection(imageId, user)
  );

  // Get image data and collection info in parallel
  const [image, collections] = await Promise.all([
    imagePromise,
    collectionsPromise,
  ]);

  // Transform the data to include collection info
  const collectionsWithSaveStatus = collections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    imageCount: collection._count.images,
    hasImage: collection.images.length > 0,
  }));

  return {
    data: {
      ...image,
      collections: collectionsWithSaveStatus,
      savedToCollection: collectionsWithSaveStatus.some((c) => c.hasImage),
    },
  };
};

export type ExplorePageImageLoader = typeof loader;

export default function Index() {
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore");
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
