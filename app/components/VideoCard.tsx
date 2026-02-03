import { Link } from "@remix-run/react";
import { Play } from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";
import { fallbackImageSource } from "~/client";

export interface VideoCardData {
  id: string;
  title?: string | null;
  prompt: string;
  model?: string | null;
  userId: string;
  url: string;
  thumbnailURL: string;
  duration?: number | null;
  aspectRatio?: string | null;
  status?: string | null;
  createdAt: Date | string;
  user?: {
    id: string;
    username: string;
    image: string | null;
  };
}

/** Props for VideoCard component */
export interface VideoCardProps {
  /** Video data to display */
  videoData: VideoCardData;
  /** Optional custom redirect URL when card is clicked */
  onClickRedirectTo?: string;
}

export const VideoCard = ({
  videoData,
  onClickRedirectTo = "",
}: VideoCardProps) => {
  const redirectTo = onClickRedirectTo || `/explore/video/${videoData.id}`;

  // Format duration as MM:SS
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formattedDuration = formatDuration(videoData.duration);

  return (
    <div className="relative w-full h-full pt-[100%]">
      <Link
        className="absolute inset-0 block group"
        prefetch="intent"
        to={redirectTo}
      >
        {/* Thumbnail image */}
        <OptimizedImage
          src={videoData.thumbnailURL}
          alt={videoData.prompt}
          containerClassName="absolute inset-0 w-full h-full"
          className="inset-0 object-cover cursor-pointer absolute w-full h-full"
          rootMargin="300px"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImageSource) {
              target.src = fallbackImageSource;
            }
          }}
        />

        {/* Video indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-3 opacity-80 group-hover:opacity-100 transition-opacity">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>

        {/* Duration badge */}
        {formattedDuration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {formattedDuration}
          </div>
        )}
      </Link>
    </div>
  );
};

export default VideoCard;
