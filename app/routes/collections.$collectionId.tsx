import {
  type LoaderFunctionArgs,
  defer,
  type SerializeFrom,
  MetaFunction,
} from "@remix-run/node";
import { invariantResponse } from "~/utils";
import { prisma } from "~/services/prisma.server";
import CollectionDetailsPage from "~/pages/CollectionDetailsPage";
import { getS3BucketBlurURL, getS3BucketThumbnailURL, getS3BucketURL } from "~/utils/s3Utils";
import { Link } from "@remix-run/react";

export const meta: MetaFunction<typeof loader> = () => {
  // Note: With defer, collection is a Promise that hasn't resolved yet
  // so we use a generic title that will be updated by the page
  return [
    { title: "Collection | AI Image Gallery" },
    {
      name: "description",
      content: "View images in this collection",
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
          blurURL: getS3BucketBlurURL(image.image?.id || ""),
        })),
      };
    });

  return defer({
    collection: collectionPromise,
  });
};

export type CollectionDetailsLoader = SerializeFrom<typeof loader>;

export default function Index() {
  return <CollectionDetailsPage />;
}

export function ErrorBoundary() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
        <p className="text-zinc-500 mb-4">
          The collection you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          to="/explore"
          prefetch="intent"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          Back to Explore
        </Link>
      </div>
    </div>
  );
}
