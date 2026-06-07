import React from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Await,
  useAsyncValue,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import {
  PageContainer,
  GeneralErrorBoundary,
  ErrorList,
  ImageGridSkeleton,
} from "~/components";
import { requireUserLogin } from "~/services/auth.server";
import { Loader2, Heart } from "lucide-react";
import { PageHeader, EmptyState, Button } from "~/components/ps";
import { Link } from "@remix-run/react";
import { ImageDetail } from "~/server/getImage";
import ImageModal from "~/components/ImageModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getLikedImages } from "~/server/getLikedImages";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import { fallbackImageSource } from "~/client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const cacheKey = `liked-images:user:${user.id}`;
  const images = getCachedDataWithRevalidate(cacheKey, () =>
    getLikedImages(user.id)
  );

  return { images };
}

export type LikedImagesLoaderData = typeof loader;

const LoadingSkeleton = () => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Content skeleton */}
      <ImageGridSkeleton />
    </div>
  );
};

const ImageCard = ({
  imageData,
  onImageClick,
}: {
  imageData: ImageDetail;
  onImageClick: () => void;
}) => {
  return (
    <div
      className="group relative w-full overflow-hidden rounded-md border border-[var(--border)] bg-surface-2 pt-[100%] transition-all duration-200 hover:-translate-y-[3px] hover:border-border-accent hover:shadow-lg"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onImageClick();
        }
      }}
      onClick={onImageClick}
    >
      <img
        loading="lazy"
        src={imageData!.thumbnailURL}
        alt={imageData!.prompt}
        className="absolute inset-0 h-full w-full cursor-pointer object-cover"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (imageData?.url && target.src !== imageData.url && target.src !== fallbackImageSource) {
            target.src = imageData.url;
          } else if (target.src !== fallbackImageSource) {
            target.src = fallbackImageSource;
          }
        }}
      />
    </div>
  );
};

const LikePageAccessor = () => {
  const asyncData = useAsyncValue() as Awaited<
    Awaited<ReturnType<LikedImagesLoaderData>>["images"]
  >;
  const images = asyncData;

  const [selectedImageIndex, setSelectedImageIndex] = React.useState<
    number | null
  >(null);

  const currentImage =
    selectedImageIndex !== null ? images[selectedImageIndex] : null;

  // const handlePrevious = () => {
  //   setSelectedImageIndex((current) =>
  //     current && current > 0 ? current - 1 : images.length - 1
  //   );
  // };

  // const handleNext = () => {
  //   setSelectedImageIndex((current) =>
  //     current && current < images.length - 1 ? current + 1 : 0
  //   );
  // };

  const handleClose = () => {
    setSelectedImageIndex(null);
  };

  return (
    <div className="relative min-h-[400px]">
      {images.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-[27px] w-[27px]" strokeWidth={1.8} />}
          title="No liked creations yet"
          subtitle="Tap the heart on anything you love and it'll show up here."
          action={
            <Link to="/explore" prefetch="intent">
              <Button variant="primary" size="md">
                Browse Explore
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {images.map(
            (image, index) =>
              image && (
                <li key={image.id}>
                  <ImageCard
                    imageData={image}
                    onImageClick={() => setSelectedImageIndex(index)}
                  />
                </li>
              )
          )}
        </ul>
      )}

      {currentImage !== null && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent
            hideClose
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100]"
            onInteractOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            <VisuallyHidden>
              <DialogTitle>Image Details</DialogTitle>
            </VisuallyHidden>
            <ImageModal
              imageData={currentImage}
              onClose={handleClose}
              // onNext={handleNext}
              // onPrevious={handlePrevious}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default function LikedImages() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <PageContainer>
      <PsLikedHeader />
      <React.Suspense fallback={<LoadingSkeleton />}>
        <Await
          resolve={loaderData.images}
          errorElement={
            <ErrorList errors={["There was an error loading images"]} />
          }
        >
          <div className="relative">
            {isLoading ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-fg-muted" />
              </div>
            ) : (
              <LikePageAccessor />
            )}
          </div>
        </Await>
      </React.Suspense>
    </PageContainer>
  );
}

function PsLikedHeader() {
  return (
    <PageHeader
      icon={<Heart className="h-[20px] w-[20px]" strokeWidth={2} />}
      title="Liked"
      subtitle="Creations you've saved with a heart"
    />
  );
}

export function ErrorBoundary() {
  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Liked Images</h1>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
