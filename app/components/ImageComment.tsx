import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { Link, useFetcher } from "@remix-run/react";
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
  imageId: string;
  message: string;
  createdAt: Date | string;
  user: CommentUser;
  likes: CommentLike[];
}

interface FetcherData {
  error?: string;
  success?: boolean;
}

export const ImageComment = ({
  id,
  imageId,
  message,
  createdAt,
  user,
  likes,
}: ImageCommentProps) => {
  const loggedInUser = useLoggedInUser();
  const fetcher = useFetcher<FetcherData>();
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
        action: `/api/images/${imageId}/comments/${id}/like`,
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
        action: `/api/images/${imageId}/comments/${id}`,
      }
    );
  };

  React.useEffect(() => {
    if (fetcher.data?.error) {
      toast.error(fetcher.data.error);

      if (isDeleting) {
        setIsDeleting(false);
      } else {
        setIsLiked((prev) => !prev);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } else if (fetcher.data?.success) {
      if (isDeleting) {
        toast.success("Comment deleted");
      }
    }
  }, [fetcher.data, isDeleting, isLiked]);

  return (
    <div className={cn("flex gap-3 group", isDeleting && "opacity-50")}>
      <Avatar className="h-8 w-8 shrink-0">
        {user.image && <AvatarImage src={user.image} alt={user.username} />}
        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 break-words">
            <p className="text-sm leading-normal">
              <Link
                to={`/profile/${user.id}`}
                prefetch="intent"
                className="font-semibold hover:underline mr-2"
              >
                {user.username}
              </Link>
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
                "h-8 w-8 group-hover:opacity-100 transition-opacity",
                isLiked
                  ? "text-red-500 opacity-100"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-full"
              )}
              onClick={handleLikeClick}
              disabled={isLoading || !loggedInUser}
            >
              {isLiked ? (
                <Heart className="h-4 w-4 fill-current" />
              ) : (
                <Heart className="h-4 w-4" strokeWidth={1.5} />
              )}
            </Button>
            {isCommentOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 group-hover:opacity-100 transition-opacity text-zinc-500 rounded-full"
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
