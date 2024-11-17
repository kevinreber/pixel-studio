import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useFetcher } from "@remix-run/react";
import { useLoggedInUser } from "~/hooks";
import React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentUser {
  id: string;
  username: string;
  image: string | null;
}

interface CommentLike {
  userId: string;
}

interface ImageCommentProps {
  id: string;
  message: string;
  createdAt: Date;
  user: CommentUser;
  likes: CommentLike[];
}

export const ImageComment = ({
  id,
  message,
  createdAt,
  user,
  likes,
}: ImageCommentProps) => {
  const loggedInUser = useLoggedInUser();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const [isLiked, setIsLiked] = React.useState(
    likes?.some((like) => like.userId === loggedInUser?.id) ?? false
  );
  const [likeCount, setLikeCount] = React.useState(likes?.length ?? 0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isCommentOwner = loggedInUser?.id === user.id;
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const handleLikeClick = () => {
    if (isLoading || !loggedInUser) return;

    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    fetcher.submit(
      { commentId: id },
      {
        method: isLiked ? "DELETE" : "POST",
        action: `/api/comments/${id}/like`,
      }
    );
  };

  const handleDeleteClick = () => {
    if (isDeleting || !isCommentOwner) return;

    setIsDeleting(true);
    fetcher.submit(
      { commentId: id },
      {
        method: "DELETE",
        action: `/api/comments/${id}`,
      }
    );
  };

  React.useEffect(() => {
    if (fetcher.data?.error) {
      toast.error(fetcher.data.error);
      setIsLiked((prev) => !prev);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }
  }, [fetcher.data, isLiked]);

  return (
    <div className={cn("flex gap-3 group", isDeleting && "opacity-50")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 break-words">
            <p className="text-sm leading-normal">
              <a
                href={`/profile/${user.id}`}
                className="font-semibold hover:underline mr-2"
              >
                {user.username}
              </a>
              <span className="text-zinc-200">{message}</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
              <span>{formattedDate}</span>
              {likeCount > 0 && (
                <span>
                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                isLiked && "text-red-500 opacity-100"
              )}
              onClick={handleLikeClick}
              disabled={isLoading || !loggedInUser}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            </Button>
            {isCommentOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};