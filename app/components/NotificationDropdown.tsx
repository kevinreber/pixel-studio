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

/** Props for NotificationDropdown component */
export interface NotificationDropdownProps {
  /** Whether to show the "Notifications" label text alongside the icon */
  showLabel?: boolean;
}

export const NotificationDropdown = ({
  showLabel = false,
}: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const markAllReadButtonRef = React.useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = React.useState<
    SerializedNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const fetcherLoad = useFetcher<NotificationsResponse>();
  const fetcherCount = useFetcher<NotificationsResponse>();
  const fetcherMarkRead = useFetcher();
  const fetcherMarkAllRead = useFetcher();
  const fetcherDelete = useFetcher();

  // Prevent hydration mismatch by only rendering on client
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch unread count on mount and periodically
  React.useEffect(() => {
    if (!isMounted) return;

    fetcherCount.load("/api/notifications?countOnly=true");

    const interval = setInterval(() => {
      fetcherCount.load("/api/notifications?countOnly=true");
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

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
    // Optimistic update - only decrement if notification was actually unread
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId && !n.read) {
          wasUnread = true;
          return { ...n, read: true };
        }
        return n;
      })
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

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
    // Optimistic update - use functional update to get current state
    let wasUnread = false;
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        wasUnread = true;
      }
      return prev.filter((n) => n.id !== notificationId);
    });
    if (wasUnread) {
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

  // Focus management: focus the "Mark all read" button when popover opens with unread notifications
  React.useEffect(() => {
    if (isOpen && hasLoadedOnce && unreadCount > 0 && markAllReadButtonRef.current) {
      // Small delay to ensure the popover content is rendered
      const timeoutId = setTimeout(() => {
        markAllReadButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, hasLoadedOnce, unreadCount]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={
            showLabel
              ? "w-full flex items-center gap-2 px-3 py-2 rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors font-medium"
              : "relative grid h-9 w-9 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
          }
          aria-label="Notifications"
        >
          <span className="relative">
            <Bell className={showLabel ? "h-[18px] w-[18px]" : "h-[18px] w-[18px]"} strokeWidth={2} />
            {isMounted && unreadCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--accent-fg)] ring-2 ring-[var(--bg)]"
                aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          {showLabel && <span>Notifications</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] rounded-md border border-border-strong bg-surface-2 p-0 shadow-pop"
        align="end"
        sideOffset={10}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-[14px] font-semibold text-fg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              ref={markAllReadButtonRef}
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-[12px] font-semibold text-[var(--accent-text)] hover:bg-accent-soft"
              onClick={handleMarkAllRead}
              aria-label={`Mark all ${unreadCount} notifications as read`}
            >
              <Check className="mr-1 h-3 w-3" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[420px]">
          {isInitialLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-fg-subtle">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-[var(--accent-text)]">
                <Bell className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="text-[13.5px] text-fg">You&apos;re all caught up</p>
              <p className="mt-0.5 text-[12px] text-fg-subtle">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
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
