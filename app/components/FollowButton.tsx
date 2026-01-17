import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLoggedInUser } from "~/hooks";
import { useFetcher } from "@remix-run/react";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton = ({
  targetUserId,
  isFollowing: initialIsFollowing,
  onFollowChange,
}: FollowButtonProps) => {
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);
  const fetcher = useFetcher<{ success: boolean }>();
  // Only show loading during actual submission, not during revalidation
  const isSubmitting = fetcher.state === "submitting";

  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
  const [previousFollowState, setPreviousFollowState] = React.useState(initialIsFollowing);

  // Use ref to avoid re-render loops from callback changes
  const onFollowChangeRef = React.useRef(onFollowChange);
  onFollowChangeRef.current = onFollowChange;

  // Revert optimistic update if the action failed
  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && !fetcher.data.success) {
      setIsFollowing(previousFollowState);
      onFollowChangeRef.current?.(previousFollowState);
    }
  }, [fetcher.state, fetcher.data, previousFollowState]);

  // Don't show the button if viewing own profile
  if (userData?.id === targetUserId) {
    return null;
  }

  const disableButton = !isUserLoggedIn || isSubmitting;

  const handleClick = () => {
    if (disableButton) return;

    const newFollowingState = !isFollowing;
    setPreviousFollowState(isFollowing);
    setIsFollowing(newFollowingState);
    onFollowChange?.(newFollowingState);

    fetcher.submit(
      {},
      {
        method: isFollowing ? "DELETE" : "POST",
        action: `/api/users/${targetUserId}/follow`,
      }
    );
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={`min-w-[100px] font-semibold ${
        isFollowing
          ? "border-zinc-600 hover:bg-zinc-800 hover:text-red-400 hover:border-red-400"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
      disabled={disableButton}
      onClick={handleClick}
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </Button>
  );
};
