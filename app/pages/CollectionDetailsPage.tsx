import {
  Await,
  Link,
  useLoaderData,
  useNavigation,
  useAsyncValue,
} from "@remix-run/react";
import type { CollectionDetailsLoader } from "~/routes/collections.$collectionId";
import { PageContainer, ImageCard } from "~/components";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";
import { convertUtcDateToLocalDateString } from "~/client";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import type { ImageDetail } from "~/server/getImage";

type ResolvedCollection = Awaited<CollectionDetailsLoader["collection"]>;

const CollectionDetailsAccessor = ({
  isNavigating,
}: {
  isNavigating: boolean;
}) => {
  const resolvedCollection = useAsyncValue() as ResolvedCollection;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      )}

      {/* Collection Header */}
      <div className="py-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">{resolvedCollection.title}</h1>
          {resolvedCollection.description && (
            <p className="text-zinc-500">{resolvedCollection.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Avatar className="h-8 w-8">
            {resolvedCollection.user.image ? (
              <AvatarImage
                src={resolvedCollection.user.image}
                alt={resolvedCollection.user.username}
              />
            ) : (
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <Link
              to={`/profile/${resolvedCollection.user.id}`}
              prefetch="intent"
              className="font-medium hover:underline"
            >
              {resolvedCollection.user.username}
            </Link>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>
                {resolvedCollection.imageCount}{" "}
                {resolvedCollection.imageCount === 1 ? "image" : "images"}
              </span>
              <span>•</span>
              <span>
                Created{" "}
                {convertUtcDateToLocalDateString(resolvedCollection.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {resolvedCollection.images.length > 0 ? (
        <div className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {resolvedCollection.images.map((image) => (
              <ImageCard
                key={image.id}
                imageData={
                  {
                    ...image,
                    id: image.id || "",
                    prompt: image.prompt || "",
                    model: image.model || null,
                    stylePreset: image.stylePreset || null,
                    private: image.private ?? null,
                    createdAt: new Date(image.createdAt || Date.now()),
                    user: image.user || { id: "", username: "", image: null },
                    setId: image.setId || null,
                    comments: [],
                    likes: [],
                  } as ImageDetail
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-zinc-500">No images in this collection yet.</p>
        </div>
      )}
    </div>
  );
};

const CollectionDetailsSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
      <div className="py-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-64 bg-gray-700/50" />
          <Skeleton className="h-4 w-96 bg-gray-700/50" />
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Skeleton className="h-8 w-8 rounded-full bg-gray-700/50" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-gray-700/50" />
            <Skeleton className="h-3 w-48 bg-gray-700/50" />
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square w-full bg-gray-700/50" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function CollectionDetailsPage() {
  const { collection } = useLoaderData<CollectionDetailsLoader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PageContainer>
      <React.Suspense fallback={<CollectionDetailsSkeleton />}>
        <Await
          resolve={collection}
          errorElement={
            <div className="p-4">
              <p className="text-red-500">Error loading collection details</p>
            </div>
          }
        >
          <CollectionDetailsAccessor isNavigating={isNavigating} />
        </Await>
      </React.Suspense>
    </PageContainer>
  );
}
