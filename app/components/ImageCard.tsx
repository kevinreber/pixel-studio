import React, { memo, useCallback } from "react";
import { Link } from "@remix-run/react";
import { Shuffle } from "lucide-react";
import { ImageDetail } from "~/server/getImage";
import { OptimizedImage } from "./OptimizedImage";
import { useImagePreload } from "~/hooks";
import { fallbackImageSource } from "~/client";

/** Props for ImageGrid component */
export interface ImageGridProps {
  /** Array of images to display in the grid */
  images: ImageDetail[];
}

export const ImageGrid = ({ images }: ImageGridProps) => {
  if (!images || images.length === 0) {
    return (
      <p className="text-center w-full block italic font-light">
        No images found
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
      {images.map(
        (image) =>
          image && (
            <li key={image.id} className="hover:!opacity-60">
              <ImageCard imageData={image} />
            </li>
          )
      )}
    </ul>
  );
};

/** Props for ImageCard component */
export interface ImageCardProps {
  /** Image data to display */
  imageData: ImageDetail;
  /** Optional custom redirect URL when card is clicked */
  onClickRedirectTo?: string;
}

export const ImageCard = memo(function ImageCard({
  imageData,
  onClickRedirectTo = "",
}: ImageCardProps) {
  const redirectTo = onClickRedirectTo || `/explore/${imageData!.id}`;
  const { preloadImage } = useImagePreload();

  // Preload full image on hover for faster modal loading
  const handleMouseEnter = useCallback(() => {
    preloadImage(imageData?.url);
  }, [preloadImage, imageData?.url]);

  // Memoize error handler
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Fallback chain: thumbnail -> original -> placeholder
      const target = e.currentTarget;
      if (
        imageData?.url &&
        target.src !== imageData.url &&
        target.src !== fallbackImageSource
      ) {
        // First fallback: try original image if thumbnail fails
        target.src = imageData.url;
      } else if (target.src !== fallbackImageSource) {
        // Final fallback: use placeholder if original also fails
        target.src = fallbackImageSource;
      }
    },
    [imageData?.url]
  );

  return (
    <div
      className="relative w-full h-full pt-[100%]"
      onMouseEnter={handleMouseEnter}
    >
      <Link
        className="absolute inset-0 block"
        prefetch="intent"
        to={redirectTo}
      >
        <OptimizedImage
          src={imageData!.thumbnailURL}
          alt={imageData!.prompt}
          blurSrc={imageData?.blurURL}
          containerClassName="absolute inset-0 w-full h-full"
          className="inset-0 object-cover cursor-pointer absolute w-full h-full"
          rootMargin="300px"
          onError={handleError}
        />
      </Link>
      {/* Remix indicator badge */}
      {imageData?.isRemix && (
        <div className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-gradient-to-r from-purple-500/80 to-rose-500/80 shadow-lg">
          <Shuffle className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
});
