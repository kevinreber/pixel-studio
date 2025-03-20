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
import { Loader2 } from "lucide-react";
import { ImageDetail } from "~/server/getImage";
import ImageModal from "~/components/ImageModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getLikedImages } from "~/server/getLikedImages";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const images = getLikedImages(user.id);

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
  // console.log("imageData", imageData);

  return (
    <>
      <div
        className="relative w-full h-full pt-[100%]"
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
            src={imageData!.thumbnailURL}
            alt={imageData!.prompt}
            className="inset-0 object-cover cursor-pointer absolute w-full h-full"
            decoding="async"
          />
        </div>
      </div>
    </>
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
        <p className="text-center w-full block italic font-light">
          No images found
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
            {images.map(
              (image, index) =>
                image && (
                  <li key={image.id} className="hover:!opacity-60">
                    <ImageCard
                      imageData={image}
                      onImageClick={() => setSelectedImageIndex(index)}
                    />
                  </li>
                )
            )}
          </ul>
        </>
      )}

      {currentImage !== null && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent
            className="w-full md:max-w-[90%] md:h-[90vh] h-[100vh] p-0 gap-0 dark:bg-zinc-900 overflow-hidden z-[100] [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10 [&>button_span]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <VisuallyHidden asChild></VisuallyHidden>
            <ImageModal
              imageData={currentImage}
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
      <div className="flex flex-col justify-between w-full max-w-5xl m-auto">
        <h1 className="text-2xl font-bold mb-3">Liked Images</h1>
        <React.Suspense fallback={<LoadingSkeleton />}>
          <Await
            resolve={loaderData.images}
            errorElement={
              <ErrorList errors={["There was an error loading images"]} />
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
                <LikePageAccessor />
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
          <h1 className="text-2xl font-bold">Liked Images</h1>
        </div>
      </div>
      <GeneralErrorBoundary />
    </PageContainer>
  );
}
