import { Link } from "@remix-run/react";
import { Shuffle } from "lucide-react";
import { ImageDetail } from "~/server/getImage";

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

  return (
    <div className="relative w-full h-full pt-[100%]">
      <Link
        className="absolute inset-0 block"
        prefetch="intent"
        to={redirectTo}
      >
        <img
          loading="lazy"
          src={imageData!.thumbnailURL}
          alt={imageData!.prompt}
          className="inset-0 object-cover cursor-pointer absolute w-full h-full"
          decoding="async"
          onError={(e) => {
            // Fallback to original image if thumbnail not ready yet
            const target = e.currentTarget;
            if (imageData?.url && target.src !== imageData.url) {
              target.src = imageData.url;
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
