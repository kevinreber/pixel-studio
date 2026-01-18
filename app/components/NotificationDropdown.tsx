import React from "react";
import { useFetcher } from "@remix-run/react";
import { Bell, Check, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";

// Serialized notification type (Date becomes string over JSON)
export interface SerializedNotification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    image: string | null;
  } | null;
  image: {
    id: string;
    title: string | null;
    prompt: string;
  } | null;
  comment: {
    id: string;
    message: string;
  } | null;
}

interface NotificationsResponse {
  success: boolean;
  notifications?: SerializedNotification[];
  unreadCount?: number;
  nextCursor?: string | null;
  count?: number;
}

interface NotificationDropdownProps {
  showLabel?: boolean;
}

export const NotificationDropdown = ({
  showLabel = false,
}: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<
    SerializedNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  const fetcherLoad = useFetcher<NotificationsResponse>();
  const fetcherCount = useFetcher<NotificationsResponse>();
  const fetcherMarkRead = useFetcher();
  const fetcherMarkAllRead = useFetcher();
  const fetcherDelete = useFetcher();

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    fetcherCount.load("/api/notifications?countOnly=true");

    const interval = setInterval(() => {
      fetcherCount.load("/api/notifications?countOnly=true");
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update unread count from count fetcher
  React.useEffect(() => {
    if (fetcherCount.data?.success && fetcherCount.data.count !== undefined) {
      setUnreadCount(fetcherCount.data.count);
    }
  }, [fetcherCount.data]);

  // Fetch notifications when popover opens
  React.useEffect(() => {
    if (isOpen) {
      fetcherLoad.load("/api/notifications");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update notifications from load fetcher
  React.useEffect(() => {
    if (fetcherLoad.data?.success && fetcherLoad.data.notifications) {
      setNotifications(fetcherLoad.data.notifications);
      setHasLoadedOnce(true);
      if (fetcherLoad.data.unreadCount !== undefined) {
        setUnreadCount(fetcherLoad.data.unreadCount);
      }
    }
  }, [fetcherLoad.data]);

  const handleMarkRead = (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    fetcherMarkRead.submit(
      {},
      {
        method: "POST",
        action: `/api/notifications/${notificationId}/read`,
      }
    );
  };

  const handleMarkAllRead = () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    fetcherMarkAllRead.submit(
      {},
      {
        method: "POST",
        action: "/api/notifications",
      }
    );
  };

  const handleDelete = (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    fetcherDelete.submit(
      {},
      {
        method: "DELETE",
        action: `/api/notifications/${notificationId}`,
      }
    );
  };

  // Only show loading spinner on initial load, not during background refreshes
  const isInitialLoading = fetcherLoad.state === "loading" && !hasLoadedOnce;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={
            showLabel
              ? "w-full flex items-center px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
              : "relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          }
          aria-label="Notifications"
        >
          <span className="relative">
            <Bell className={showLabel ? "md:h-4 md:w-4" : "h-5 w-5"} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          {showLabel && <span className="ml-2">Notifications</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-zinc-900 border-zinc-700"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <h3 className="font-semibold text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1"
              onClick={handleMarkAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {isInitialLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
