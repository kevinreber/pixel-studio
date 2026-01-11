import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useLoggedInUser } from "~/hooks";
import { useFetcher } from "@remix-run/react";

interface LikeImageButtonProps {
  imageData: {
    id?: string;
    likes?: Array<{ userId: string }>;
  };
}

export const LikeImageButton = ({ imageData }: LikeImageButtonProps) => {
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const disableButton = !isUserLoggedIn || isLoading;

  const [isLiked, setIsLiked] = React.useState(
    imageData.likes?.some((like) => like.userId === userData?.id) ?? false
  );
  const [likeCount, setLikeCount] = React.useState(
    imageData.likes?.length ?? 0
  );
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = async () => {
    if (disableButton || !imageData.id) return;

    setIsAnimating(true);
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      fetcher.submit(
        { imageId: imageData.id },
        {
          method: isLiked ? "DELETE" : "POST",
          action: `/api/images/${imageData.id}/like`,
        }
      );
    } catch (error) {
      // Revert on error
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "hover:text-zinc-600 transition-all duration-200",
          isLiked && "text-red-500 hover:text-red-600",
          isAnimating && "scale-125"
        )}
        disabled={disableButton}
        onClick={handleClick}
      >
        <Heart
          className={cn(
            "h-6 w-6",
            isLiked && "fill-current",
            isAnimating && "animate-heartBeat"
          )}
        />
      </Button>
      <span className="text-sm font-semibold">{likeCount} likes</span>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
