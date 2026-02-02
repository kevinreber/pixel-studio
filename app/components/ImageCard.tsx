import { Link } from "@remix-run/react";
import { Shuffle } from "lucide-react";
import { ImageDetail } from "~/server/getImage";
import { OptimizedImage } from "./OptimizedImage";
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

export const ImageCard = ({
  imageData,
  onClickRedirectTo = "",
}: ImageCardProps) => {
  const redirectTo = onClickRedirectTo || `/explore/${imageData!.id}`;

  return (
    <div className="relative w-full h-full pt-[100%]">
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
          onError={(e) => {
            // Fallback chain: thumbnail -> original -> placeholder
            const target = e.currentTarget;
            if (imageData?.url && target.src !== imageData.url && target.src !== fallbackImageSource) {
              target.src = imageData.url;
            } else if (target.src !== fallbackImageSource) {
              target.src = fallbackImageSource;
            }
          }}
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
};
