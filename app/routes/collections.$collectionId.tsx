import {
  type LoaderFunctionArgs,
  defer,
  type SerializeFrom,
  MetaFunction,
} from "@remix-run/node";
import { invariantResponse } from "~/utils";
import { prisma } from "~/services/prisma.server";
import CollectionDetailsPage from "~/pages/CollectionDetailsPage";
import { getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const collection = data?.collection;
  return [
    { title: `${collection?.title || "Collection"} | AI Image Gallery` },
    {
      name: "description",
      content: `View images in collection "${collection?.title}"`,
    },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const collectionId = params.collectionId;
  invariantResponse(collectionId, "Collection ID is required");

  // We wrap the database query in a Promise to use with defer
  const collectionPromise = prisma.collection
    .findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        images: {
          select: {
            image: {
              select: {
                id: true,
                model: true,
                stylePreset: true,
                prompt: true,
                title: true,
                createdAt: true,
                userId: true,
                private: true,
                setId: true,
                updatedAt: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
          },
          orderBy: {
            image: {
              createdAt: "desc",
            },
          },
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
    })
    .then((collection) => {
      if (!collection) {
        throw new Response("Collection not found", { status: 404 });
      }

      return {
        ...collection,
        imageCount: collection._count.images,
        images: collection.images.map((image) => ({
          ...image.image,
          url: getS3BucketURL(image.image?.id || ""),
          thumbnailURL: getS3BucketThumbnailURL(image.image?.id || ""),
        })),
      };
    });

  return defer({
    collection: collectionPromise,
  });
};

export type CollectionDetailsLoader = SerializeFrom<typeof loader>;

export default function CollectionRoute() {
  return <CollectionDetailsPage />;
}

export function ErrorBoundary() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
        <p className="text-zinc-500 mb-4">
          The collection you're looking for doesn't exist or has been removed.
        </p>
        <a
          href="/explore"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          Back to Explore
        </a>
      </div>
    </div>
  );
}
