import React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Await,
  useAsyncValue,
  useLoaderData,
  useNavigation,
  Link,
} from "@remix-run/react";
import {
  PageContainer,
  GeneralErrorBoundary,
  ErrorList,
  ImageGridSkeleton,
} from "~/components";
import { requireUserLogin } from "~/services/auth.server";
import { Loader2, UserPlus } from "lucide-react";
import ImageModal from "~/components/ImageModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getFollowingFeed } from "~/server/getFollowingFeed.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const searchParams = new URL(request.url).searchParams;
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Number(searchParams.get("page_size")) || 20;

  const cacheKey = `following-feed:${user.id}:${currentPage}:${pageSize}`;
  const feedData = getCachedDataWithRevalidate(cacheKey, () =>
    getFollowingFeed(user.id, currentPage, pageSize)
  );

  return { feedData, currentPage };
}

export type FeedLoaderData = typeof loader;

type FeedImage = Awaited<Awaited<ReturnType<FeedLoaderData>>["feedData"]>["images"][number];

const LoadingSkeleton = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <ImageGridSkeleton />
    </div>
  );
};

const FeedImageCard = ({
  imageData,
  onImageClick,
}: {
  imageData: FeedImage;
  onImageClick: () => void;
}) => {
  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden">
      {/* User info header */}
      <div className="flex items-center gap-3 p-3">
        <Link to={`/profile/${imageData.user.id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar className="w-8 h-8">
            <AvatarImage src={imageData.user.image || undefined} alt={imageData.user.username} />
            <AvatarFallback className="text-xs">
              {imageData.user.name?.charAt(0) || imageData.user.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{imageData.user.username}</span>
        </Link>
      </div>

      {/* Image */}
      <div
        className="relative w-full pt-[100%] cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onImageClick();
          }
        }}
        onClick={onImageClick}
      >
        <div className="absolute inset-0 block">
          <img
            loading="lazy"
            src={imageData.thumbnailURL || `/images/${imageData.id}`}
            alt={imageData.prompt}
            className="inset-0 object-cover absolute w-full h-full"
            decoding="async"
          />
        </div>
      </div>

      {/* Engagement info */}
      <div className="p-3">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>{imageData._count.likes} likes</span>
          <span>{imageData._count.comments} comments</span>
        </div>
        <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{imageData.prompt}</p>
      </div>
    </div>
  );
};

const EmptyFeed = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <UserPlus className="h-16 w-16 text-zinc-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Your feed is empty</h2>
      <p className="text-zinc-500 mb-6 max-w-md">
        Follow other creators to see their images in your feed. Discover new artists and get inspired!
      </p>
      <Button asChild>
        <Link to="/explore">Explore Images</Link>
      </Button>
    </div>
  );
};

const FeedAccessor = () => {
  const asyncData = useAsyncValue() as Awaited<
    Awaited<ReturnType<FeedLoaderData>>["feedData"]
  >;
  const images = asyncData.images;

  const [selectedImageIndex, setSelectedImageIndex] = React.useState<
    number | null
  >(null);

  const currentImage =
    selectedImageIndex !== null ? images[selectedImageIndex] : null;

  const handleClose = () => {
    setSelectedImageIndex(null);
  };

  if (images.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <div className="relative min-h-[400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <FeedImageCard
            key={image.id}
            imageData={image}
            onImageClick={() => setSelectedImageIndex(index)}
          />
        ))}
      </div>

      {currentImage !== null && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <VisuallyHidden>
              <DialogTitle>Image Details</DialogTitle>
            </VisuallyHidden>
            <ImageModal imageData={currentImage} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default function FeedPage() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-bold mb-3">Your Feed</h1>
        <p className="text-zinc-500 mb-6">Images from people you follow</p>
        <React.Suspense fallback={<LoadingSkeleton />}>
          <Await
            resolve={loaderData.feedData}
            errorElement={
              <ErrorList errors={["There was an error loading your feed"]} />
            }
          >
            <div className="relative">
              {isLoading ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                </div>
              ) : (
                <FeedAccessor />
              )}
            </div>
          </Await>
        </React.Suspense>
      </div>
    </PageContainer>
  );
}

export function ErrorBoundary() {
  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Feed</h1>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
