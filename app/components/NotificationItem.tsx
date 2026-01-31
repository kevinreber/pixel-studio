import React from "react";
import { Link } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { SerializedNotification } from "./NotificationDropdown";

/** Props for NotificationItem component */
export interface NotificationItemProps {
  /** The notification data to display */
  notification: SerializedNotification;
  /** Callback when notification is marked as read */
  onMarkRead?: (id: string) => void;
  /** Callback when notification is deleted */
  onDelete?: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "NEW_FOLLOWER":
      return <UserPlus className="h-4 w-4 text-blue-400" />;
    case "IMAGE_LIKED":
      return <Heart className="h-4 w-4 text-red-400" />;
    case "IMAGE_COMMENT":
      return <MessageCircle className="h-4 w-4 text-green-400" />;
    case "IMAGE_COMPLETED":
      return <ImageIcon className="h-4 w-4 text-purple-400" />;
    default:
      return null;
  }
};

const getNotificationMessage = (notification: SerializedNotification) => {
  const actorName = notification.actor?.username || "Someone";

  switch (notification.type) {
    case "NEW_FOLLOWER":
      return (
        <>
          <span className="font-semibold">{actorName}</span> started following
          you
        </>
      );
    case "IMAGE_LIKED":
      return (
        <>
          <span className="font-semibold">{actorName}</span> liked your image
        </>
      );
    case "IMAGE_COMMENT":
      return (
        <>
          <span className="font-semibold">{actorName}</span> commented on your
          image
          {notification.comment?.message && (
            <span className="text-gray-400 block text-sm truncate max-w-[200px]">
              &ldquo;{notification.comment.message}&rdquo;
            </span>
          )}
        </>
      );
    case "IMAGE_COMPLETED":
      return <>Your image has finished generating</>;
    default:
      return <>You have a new notification</>;
  }
};

const getNotificationLink = (notification: SerializedNotification) => {
  switch (notification.type) {
    case "NEW_FOLLOWER":
      return notification.actor ? `/profile/${notification.actor.id}` : "#";
    case "IMAGE_LIKED":
    case "IMAGE_COMMENT":
    case "IMAGE_COMPLETED":
      return notification.image
        ? `/explore/${notification.image.id}`
        : "#";
    default:
      return "#";
  }
};

/**
 * NotificationItem component displays a single notification.
 * Wrapped in React.memo to prevent unnecessary re-renders when parent updates.
 */
export const NotificationItem = React.memo(function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const link = getNotificationLink(notification);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleClick = React.useCallback(() => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  }, [notification.id, notification.read, onMarkRead]);

  const handleDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.(notification.id);
    },
    [notification.id, onDelete]
  );

  return (
    <Link
      to={link}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-zinc-800/50 transition-colors relative group",
        !notification.read && "bg-zinc-800/30"
      )}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Avatar or Icon */}
      <div className="flex-shrink-0 ml-2">
        {notification.actor ? (
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={notification.actor.image || undefined}
              alt={notification.actor.username}
            />
            <AvatarFallback>
              {notification.actor.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {getNotificationIcon(notification.type)}
          <p className="text-sm text-gray-200">
            {getNotificationMessage(notification)}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-opacity"
        aria-label="Delete notification"
      >
        <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>
    </Link>
  );
});
