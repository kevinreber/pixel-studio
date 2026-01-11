import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
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
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);

  // Don't show the button if viewing own profile
  if (userData?.id === targetUserId) {
    return null;
  }

  const disableButton = !isUserLoggedIn || isLoading;

  const handleClick = async () => {
    if (disableButton) return;

    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    onFollowChange?.(newFollowingState);

    try {
      fetcher.submit(
        {},
        {
          method: isFollowing ? "DELETE" : "POST",
          action: `/api/users/${targetUserId}/follow`,
        }
      );
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowingState);
      onFollowChange?.(!newFollowingState);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      className="min-w-[100px]"
      disabled={disableButton}
      onClick={handleClick}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
