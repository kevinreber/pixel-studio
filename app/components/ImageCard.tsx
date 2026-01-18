import { Link } from "@remix-run/react";
import { ImageDetail } from "~/server/getImage";
import { OptimizedImage } from "./OptimizedImage";
import { useImagePreload } from "~/hooks";
import { fallbackImageSource } from "~/client";

export const ImageGrid = ({ images }: { images: ImageDetail[] }) => {
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

export const ImageCard = ({
  imageData,
  onClickRedirectTo = "",
}: {
  imageData: ImageDetail;
  onClickRedirectTo?: string;
}) => {
  const redirectTo = onClickRedirectTo || `/explore/${imageData!.id}`;
  const { preloadImage } = useImagePreload();

  // Preload full image on hover for faster modal loading
  const handleMouseEnter = () => {
    preloadImage(imageData?.url);
  };

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
          onError={(e) => {
            // Fallback chain: thumbnail -> original -> placeholder
            const target = e.currentTarget;
            if (imageData?.url && target.src !== imageData.url && target.src !== fallbackImageSource) {
              // First fallback: try original image if thumbnail fails
              target.src = imageData.url;
            } else if (target.src !== fallbackImageSource) {
              // Final fallback: use placeholder if original also fails
              target.src = fallbackImageSource;
            }
          }}
        />
      </Link>
    </div>
  );
};
