import { useLoaderData } from "@remix-run/react";
import type { CollectionDetailsLoader } from "~/routes/collections.$collectionId";
import { PageContainer, ImageCard } from "~/components";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { convertUtcDateToLocalDateString } from "~/client";

export default function CollectionDetailsPage() {
  const { collection } = useLoaderData<CollectionDetailsLoader>();

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Collection Header */}
        <div className="py-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">{collection.title}</h1>
            {collection.description && (
              <p className="text-zinc-500">{collection.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Avatar className="h-8 w-8">
              {collection.user.image ? (
                <img
                  src={collection.user.image}
                  alt={collection.user.username}
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <a
                href={`/profile/${collection.user.id}`}
                className="font-medium hover:underline"
              >
                {collection.user.username}
              </a>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>
                  {collection.imageCount}{" "}
                  {collection.imageCount === 1 ? "image" : "images"}
                </span>
                <span>•</span>
                <span>
                  Created{" "}
                  {convertUtcDateToLocalDateString(collection.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        {collection.images.length > 0 ? (
          <div className="py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {collection.images.map((image) => (
                <ImageCard key={image.id} imageData={image} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-zinc-500">No images in this collection yet.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
