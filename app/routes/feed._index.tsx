import React, { memo, useCallback, useMemo } from "react";
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
  OptimizedImage,
} from "~/components";
import { requireUserLogin } from "~/services/auth.server";
import { Loader2, UserPlus, Play } from "lucide-react";
import ImageModal from "~/components/ImageModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  getFollowingFeed,
  type FeedItem,
  type FeedImage,
  type FeedVideo,
} from "~/server/getFollowingFeed.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useImagePreload } from "~/hooks";

// 10 minutes TTL for fresher social content in feed
const FEED_CACHE_TTL = 600;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);

  const searchParams = new URL(request.url).searchParams;
  const currentPage = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Number(searchParams.get("page_size")) || 20;

  const cacheKey = `following-feed:${user.id}:${currentPage}:${pageSize}`;
  const feedData = getCachedDataWithRevalidate(
    cacheKey,
    () => getFollowingFeed(user.id, currentPage, pageSize),
    FEED_CACHE_TTL
  );

  return { feedData, currentPage };
}

export type FeedLoaderData = typeof loader;

const LoadingSkeleton = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <ImageGridSkeleton />
    </div>
  );
};

const FeedImageCard = memo(function FeedImageCard({
  imageData,
  onImageClick,
}: {
  imageData: FeedImage;
  onImageClick: () => void;
}) {
  const { preloadImage } = useImagePreload();

  // Preload full image on hover for faster modal loading
  const handleMouseEnter = useCallback(() => {
    preloadImage(imageData?.url);
  }, [preloadImage, imageData?.url]);

  // Memoize keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onImageClick();
      }
    },
    [onImageClick]
  );

  return (
    <div
      className="bg-zinc-900 rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
    >
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
        onKeyDown={handleKeyDown}
        onClick={onImageClick}
      >
        <OptimizedImage
          src={imageData.thumbnailURL || `/images/${imageData.id}`}
          alt={imageData.prompt}
          blurSrc={imageData.blurURL}
          containerClassName="absolute inset-0 w-full h-full"
          className="inset-0 object-cover absolute w-full h-full"
          rootMargin="300px"
        />
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
});

// Format duration as MM:SS - defined outside component to prevent recreation
const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const FeedVideoCard = memo(function FeedVideoCard({
  videoData,
  onVideoClick,
}: {
  videoData: FeedVideo;
  onVideoClick: () => void;
}) {
  const formattedDuration = useMemo(
    () => formatDuration(videoData.duration),
    [videoData.duration]
  );

  // Memoize keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onVideoClick();
      }
    },
    [onVideoClick]
  );

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden">
      {/* User info header */}
      <div className="flex items-center gap-3 p-3">
        <Link to={`/profile/${videoData.user.id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar className="w-8 h-8">
            <AvatarImage src={videoData.user.image || undefined} alt={videoData.user.username} />
            <AvatarFallback className="text-xs">
              {videoData.user.name?.charAt(0) || videoData.user.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{videoData.user.username}</span>
        </Link>
      </div>

      {/* Video thumbnail */}
      <div
        className="relative w-full pt-[100%] cursor-pointer group"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={onVideoClick}
      >
        <div className="absolute inset-0 block">
          <img
            loading="lazy"
            src={videoData.thumbnailURL}
            alt={videoData.prompt}
            className="inset-0 object-cover absolute w-full h-full"
            decoding="async"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-4 opacity-80 group-hover:opacity-100 transition-opacity">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
          {/* Duration badge */}
          {formattedDuration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {formattedDuration}
            </div>
          )}
        </div>
      </div>

      {/* Engagement info */}
      <div className="p-3">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>{videoData._count.likes} likes</span>
          <span>{videoData._count.comments} comments</span>
        </div>
        <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{videoData.prompt}</p>
      </div>
    </div>
  );
});

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
  const items = asyncData.items;

  const [selectedItem, setSelectedItem] = React.useState<FeedItem | null>(null);

  const handleClose = () => {
    setSelectedItem(null);
  };

  if (items.length === 0) {
    return <EmptyFeed />;
  }

  return (
    <div className="relative min-h-[400px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) =>
          item.type === "image" ? (
            <FeedImageCard
              key={item.id}
              imageData={item}
              onImageClick={() => setSelectedItem(item)}
            />
          ) : (
            <FeedVideoCard
              key={item.id}
              videoData={item}
              onVideoClick={() => setSelectedItem(item)}
            />
          )
        )}
      </div>

      {selectedItem !== null && selectedItem.type === "image" && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <VisuallyHidden>
              <DialogTitle>Image Details</DialogTitle>
            </VisuallyHidden>
            <ImageModal imageData={selectedItem} />
          </DialogContent>
        </Dialog>
      )}

      {selectedItem !== null && selectedItem.type === "video" && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <VisuallyHidden>
              <DialogTitle>Video Details</DialogTitle>
            </VisuallyHidden>
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                  poster={selectedItem.thumbnailURL}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="p-4 bg-zinc-900">
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/profile/${selectedItem.user.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedItem.user.image || undefined} alt={selectedItem.user.username} />
                      <AvatarFallback className="text-xs">
                        {selectedItem.user.name?.charAt(0) || selectedItem.user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{selectedItem.user.username}</span>
                  </Link>
                </div>
                <p className="text-sm text-zinc-300">{selectedItem.prompt}</p>
              </div>
            </div>
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
        <p className="text-zinc-500 mb-6">Images and videos from people you follow</p>
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
