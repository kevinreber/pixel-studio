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

  const collection = await prisma.collection.findUnique({
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
  });

  invariantResponse(collection, "Collection not found", { status: 404 });

  return defer({
    collection: {
      ...collection,
      imageCount: collection._count.images,
      images: collection.images.map((image) => ({
        ...image.image,
        url: getS3BucketURL(image.image?.id || ""),
        thumbnailURL: getS3BucketThumbnailURL(image.image?.id || ""),
      })),
    },
  });
};

export type CollectionDetailsLoader = SerializeFrom<typeof loader>;

export default function CollectionRoute() {
  return <CollectionDetailsPage />;
}
