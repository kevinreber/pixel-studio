import { type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { getImage } from "~/server";
import { invariantResponse } from "~/utils";
import ExploreImageDetailsPage from "~/pages/ExploreImageDetailsPage";
import { GeneralErrorBoundary, PageContainer } from "~/components";
import { getOptionalUser } from "~/services";
import { getImageCollection } from "~/server/getImageCollection";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import {
  generateImageMetaTags,
  generateImageSchema,
  generateBreadcrumbSchema,
  serializeSchema,
  SITE_CONFIG,
} from "~/utils/seo";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.data) {
    return [{ title: "Image Not Found | Pixel Studio AI" }];
  }

  const image = data.data;
  return generateImageMetaTags({
    id: image.id ?? "",
    prompt: image.prompt ?? "",
    title: image.title,
    model: image.model,
    user: image.user,
    createdAt: image.createdAt ?? new Date().toISOString(),
  });
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const imageId = params.imageId || "";
  invariantResponse(imageId, "Image does not exist");

  // Shared image links are public, so an anonymous visitor is expected here.
  const user = await getOptionalUser(request);

  const imageDetailsCacheKey = `image-details:${imageId}`;
  const imagePromise = getCachedDataWithRevalidate(imageDetailsCacheKey, () =>
    getImage(imageId)
  );

  // Keyed by image as well as user: the payload records whether *this* image is
  // in each collection, so a user-only key serves one image's flags for another.
  const collectionsCacheKey = `user-collections:${user?.id ?? "anonymous"}:${imageId}`;
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
  const { data } = useLoaderData<typeof loader>();

  const handleCloseModal = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/explore");
    }
  };

  // Generate structured data for SEO
  const imageSchema = generateImageSchema({
    id: data.id ?? "",
    prompt: data.prompt ?? "",
    title: data.title,
    createdAt: data.createdAt ?? new Date().toISOString(),
    user: data.user,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_CONFIG.url },
    { name: "Explore", url: `${SITE_CONFIG.url}/explore` },
    { name: data.title || "Image", url: `${SITE_CONFIG.url}/explore/${data.id ?? ""}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema([imageSchema, breadcrumbSchema]),
        }}
      />
      <ExploreImageDetailsPage onClose={handleCloseModal} />
    </>
  );
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
