import React from "react";
import { Link, useFetcher } from "@remix-run/react";
import { cn } from "@/lib/utils";
import { TrendingUp, Heart, MessageCircle, Loader2, ChevronRight, Flame } from "lucide-react";
import { fallbackImageSource } from "~/client";

interface TrendingImage {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  createdAt: string;
  url: string;
  thumbnailURL: string;
  blurURL: string;
  likeCount: number;
  commentCount: number;
  score: number;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

interface TrendingVideo {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  userId: string;
  createdAt: string;
  url: string;
  thumbnailURL: string;
  likeCount: number;
  commentCount: number;
  score: number;
  user: {
    id: string;
    username: string;
    image: string | null;
  };
}

interface TrendingCreator {
  id: string;
  username: string;
  image: string | null;
  followerCount: number;
  imageCount: number;
  totalLikes: number;
  recentLikes: number;
  score: number;
}

interface TrendingData {
  images: TrendingImage[];
  videos: TrendingVideo[];
  creators: TrendingCreator[];
  period: string;
  generatedAt: string;
}

interface TrendingSectionProps {
  initialData?: TrendingData;
  period?: "24h" | "48h" | "7d" | "30d";
  showImages?: boolean;
  showVideos?: boolean;
  showCreators?: boolean;
  maxItems?: number;
  className?: string;
}

export const TrendingSection = ({
  initialData,
  period = "48h",
  showImages = true,
  showVideos = false,
  showCreators = true,
  maxItems = 10,
  className,
}: TrendingSectionProps) => {
  const fetcher = useFetcher<{ success: boolean; data: TrendingData }>();

  React.useEffect(() => {
    if (!initialData) {
      fetcher.load(`/api/trending?period=${period}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, initialData]);

  const data = initialData || fetcher.data?.data;
  const isLoading = fetcher.state === "loading";
  const hasError = fetcher.data && !fetcher.data.success;

  if (isLoading && !data) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <TrendingUp className="h-8 w-8 text-zinc-600 mb-2" />
        <p className="text-zinc-400 text-sm">Unable to load trending content</p>
        <button
          onClick={() => fetcher.load(`/api/trending?period=${period}`)}
          className="mt-2 text-xs text-zinc-500 hover:text-white underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Trending Images */}
      {showImages && data.images.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Trending Images
            </h2>
            <Link
              to="/explore?sort=trending"
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
            >
              See all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.images.slice(0, maxItems).map((image, index) => (
              <TrendingImageCard key={image.id} image={image} rank={index + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Videos */}
      {showVideos && data.videos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Trending Videos
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.videos.slice(0, maxItems).map((video, index) => (
              <TrendingVideoCard key={video.id} video={video} rank={index + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Creators */}
      {showCreators && data.creators.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Hot Creators
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
            {data.creators.slice(0, maxItems).map((creator, index) => (
              <TrendingCreatorCard key={creator.id} creator={creator} rank={index + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

interface TrendingImageCardProps {
  image: TrendingImage;
  rank: number;
}

const TrendingImageCard = ({ image, rank }: TrendingImageCardProps) => {
  return (
    <Link
      to={`/explore/${image.id}`}
      className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-900"
    >
      {/* Rank badge */}
      {rank <= 3 && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            rank === 1 && "bg-yellow-500 text-black",
            rank === 2 && "bg-slate-400 text-black",
            rank === 3 && "bg-amber-700 text-white"
          )}
        >
          {rank}
        </div>
      )}

      {/* Image */}
      <img
        loading="lazy"
        src={image.thumbnailURL}
        alt={image.prompt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        decoding="async"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallbackImageSource) {
            target.src = fallbackImageSource;
          }
        }}
      />

      {/* Overlay with stats */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-3 text-white text-sm">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-red-400" />
              {image.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
              {image.commentCount}
            </span>
          </div>
          <p className="text-xs text-zinc-300 mt-1 truncate">
            @{image.user.username}
          </p>
        </div>
      </div>
    </Link>
  );
};

interface TrendingVideoCardProps {
  video: TrendingVideo;
  rank: number;
}

const TrendingVideoCard = ({ video, rank }: TrendingVideoCardProps) => {
  return (
    <Link
      to={`/explore/video/${video.id}`}
      className="group relative aspect-video rounded-lg overflow-hidden bg-zinc-900"
    >
      {/* Rank badge */}
      {rank <= 3 && (
        <div
          className={cn(
            "absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            rank === 1 && "bg-yellow-500 text-black",
            rank === 2 && "bg-slate-400 text-black",
            rank === 3 && "bg-amber-700 text-white"
          )}
        >
          {rank}
        </div>
      )}

      {/* Video Play indicator */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 transition-colors">
          <svg
            className="w-5 h-5 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Thumbnail */}
      <img
        src={video.thumbnailURL}
        alt={video.prompt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallbackImageSource) {
            target.src = fallbackImageSource;
          }
        }}
      />

      {/* Overlay with stats */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white text-xs">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-400" />
            {video.likeCount}
          </span>
        </div>
      </div>
    </Link>
  );
};

interface TrendingCreatorCardProps {
  creator: TrendingCreator;
  rank: number;
}

const TrendingCreatorCard = ({ creator, rank }: TrendingCreatorCardProps) => {
  return (
    <Link
      to={`/profile/${creator.id}`}
      className="flex-shrink-0 flex flex-col items-center p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors min-w-[120px]"
    >
      {/* Rank */}
      {rank <= 3 && (
        <div
          className={cn(
            "text-xs font-bold mb-2",
            rank === 1 && "text-yellow-500",
            rank === 2 && "text-slate-400",
            rank === 3 && "text-amber-700"
          )}
        >
          #{rank}
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        {creator.image ? (
          <img
            src={creator.image}
            alt={creator.username}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-zinc-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-600">
            <span className="text-lg font-bold text-zinc-400">
              {creator.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {rank === 1 && (
          <div className="absolute -top-1 -right-1 text-lg">👑</div>
        )}
      </div>

      {/* Username */}
      <p className="text-sm font-semibold mt-2 text-white truncate max-w-full">
        @{creator.username}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
        <span>{creator.followerCount} followers</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5 text-xs text-red-400">
        <Heart className="h-3 w-3" />
        {creator.totalLikes} likes
      </div>
    </Link>
  );
};

// Compact trending preview for sidebar/header
interface TrendingPreviewProps {
  className?: string;
}

export const TrendingPreview = ({ className }: TrendingPreviewProps) => {
  const fetcher = useFetcher<{ success: boolean; data: TrendingData }>();

  React.useEffect(() => {
    fetcher.load("/api/trending?type=images&limit=5");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const images = fetcher.data?.data?.images || [];
  const isLoading = fetcher.state === "loading";

  if (isLoading && images.length === 0) {
    return null;
  }

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">Trending</span>
      </div>
      <div className="flex gap-1">
        {images.slice(0, 5).map((image) => (
          <Link
            key={image.id}
            to={`/explore/${image.id}`}
            className="w-10 h-10 rounded overflow-hidden hover:ring-2 ring-red-500 transition-all"
          >
            <img
              src={image.thumbnailURL}
              alt=""
              className="w-full h-full object-cover"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};
