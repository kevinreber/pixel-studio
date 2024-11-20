import { Link } from "@remix-run/react";
// import { Heart, MessageCircle } from "lucide-react";
import { ImageTagType } from "server/getImages";

const ImageCard = ({
  imageData,
  onClickRedirectTo = "",
}: {
  imageData: ImageTagType;
  onClickRedirectTo?: string;
}) => {
  const redirectTo = onClickRedirectTo || `/explore/${imageData.id}`;

  return (
    <div className="relative w-full h-full pt-[100%]">
      <Link
        className="absolute inset-0 block"
        prefetch="intent"
        to={redirectTo}
      >
        <img
          loading="lazy"
          src={imageData.thumbnailURL}
          alt={imageData.prompt}
          className="inset-0 object-cover cursor-pointer absolute w-full h-full"
          decoding="async"
        />
      </Link>
      {/* Hover Overlay */}
      {/* <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="flex items-center gap-8 text-white">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-white" />
            <span className="font-semibold">0</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 fill-white" />
            <span className="font-semibold">0</span>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default ImageCard;
