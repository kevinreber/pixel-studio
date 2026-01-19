import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";
import { useLocation } from "@remix-run/react";

// Re-export event names for client-side use
export const AnalyticsEvents = {
  // Authentication
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",

  // Image Generation
  IMAGE_GENERATION_STARTED: "image_generation_started",
  IMAGE_GENERATION_QUEUED: "image_generation_queued",
  IMAGE_GENERATION_COMPLETED: "image_generation_completed",
  IMAGE_GENERATION_FAILED: "image_generation_failed",

  // Video Generation
  VIDEO_GENERATION_STARTED: "video_generation_started",
  VIDEO_GENERATION_QUEUED: "video_generation_queued",
  VIDEO_GENERATION_COMPLETED: "video_generation_completed",
  VIDEO_GENERATION_FAILED: "video_generation_failed",

  // Image Engagement
  IMAGE_LIKED: "image_liked",
  IMAGE_UNLIKED: "image_unliked",
  IMAGE_COMMENT_CREATED: "image_comment_created",
  IMAGE_COMMENT_DELETED: "image_comment_deleted",
  IMAGE_COMMENT_LIKED: "image_comment_liked",
  IMAGE_COMMENT_UNLIKED: "image_comment_unliked",

  // Video Engagement
  VIDEO_LIKED: "video_liked",
  VIDEO_UNLIKED: "video_unliked",
  VIDEO_COMMENT_CREATED: "video_comment_created",
  VIDEO_COMMENT_DELETED: "video_comment_deleted",
  VIDEO_COMMENT_LIKED: "video_comment_liked",
  VIDEO_COMMENT_UNLIKED: "video_comment_unliked",

  // Collections
  COLLECTION_CREATED: "collection_created",
  COLLECTION_UPDATED: "collection_updated",
  COLLECTION_DELETED: "collection_deleted",
  COLLECTION_IMAGE_ADDED: "collection_image_added",
  COLLECTION_IMAGE_REMOVED: "collection_image_removed",

  // Social
  USER_FOLLOWED: "user_followed",
  USER_UNFOLLOWED: "user_unfollowed",

  // Payments
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_COMPLETED: "payment_completed",
  CREDITS_PURCHASED: "credits_purchased",
  CREDITS_SPENT: "credits_spent",

  // Navigation & Discovery
  PAGE_VIEWED: "page_viewed",
  SEARCH_PERFORMED: "search_performed",
  EXPLORE_FILTERED: "explore_filtered",
  PROFILE_VIEWED: "profile_viewed",
  FEED_VIEWED: "feed_viewed",
  IMAGE_DETAILS_VIEWED: "image_details_viewed",
  VIDEO_DETAILS_VIEWED: "video_details_viewed",

  // User Actions
  SETTINGS_UPDATED: "settings_updated",
  NOTIFICATION_READ: "notification_read",

  // Feature Usage
  MODEL_SELECTED: "model_selected",
  STYLE_PRESET_SELECTED: "style_preset_selected",
  IMAGE_DOWNLOADED: "image_downloaded",
  IMAGE_SHARED: "image_shared",

  // Errors
  ERROR_OCCURRED: "error_occurred",
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

interface UseAnalyticsOptions {
  userId?: string;
  userProperties?: Record<string, unknown>;
}

/**
 * Hook for client-side analytics tracking with PostHog.
 * Note: PostHog is initialized in entry.client.tsx - this hook uses the existing instance.
 */
export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { userId, userProperties } = options;
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const previousUserId = useRef<string | undefined>(undefined);

  // Identify user when userId changes (avoid re-identifying on every render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId) return;
    if (previousUserId.current === userId) return;

    previousUserId.current = userId;

    try {
      posthog.identify(userId, userProperties);
    } catch (error) {
      console.error("[Analytics] Failed to identify user:", error);
    }
  }, [userId, userProperties]);

  // Track page views on route change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (previousPath.current === location.pathname) return;

    previousPath.current = location.pathname;

    try {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
        path: location.pathname,
        search: location.search,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
    }
  }, [location.pathname, location.search]);

  /**
   * Track a custom event
   */
  const track = useCallback(
    (event: AnalyticsEvent | string, properties?: Record<string, unknown>) => {
      if (typeof window === "undefined") return;

      try {
        posthog.capture(event, {
          ...properties,
          timestamp: new Date().toISOString(),
        });

        if (process.env.NODE_ENV === "development") {
          console.log("[Analytics] Event tracked:", event, properties);
        }
      } catch (error) {
        console.error("[Analytics] Failed to track event:", error);
      }
    },
    []
  );

  /**
   * Identify a user
   */
  const identify = useCallback(
    (id: string, properties?: Record<string, unknown>) => {
      if (typeof window === "undefined") return;

      try {
        posthog.identify(id, properties);
      } catch (error) {
        console.error("[Analytics] Failed to identify user:", error);
      }
    },
    []
  );

  /**
   * Reset user identity (for logout)
   */
  const reset = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      posthog.reset();
    } catch (error) {
      console.error("[Analytics] Failed to reset:", error);
    }
  }, []);

  /**
   * Set user properties without creating an event
   */
  const setUserProperties = useCallback(
    (properties: Record<string, unknown>) => {
      if (typeof window === "undefined") return;

      try {
        posthog.people.set(properties);
      } catch (error) {
        console.error("[Analytics] Failed to set user properties:", error);
      }
    },
    []
  );

  /**
   * Track a feature flag evaluation
   */
  const trackFeatureFlag = useCallback(
    (flagName: string, value: boolean | string) => {
      if (typeof window === "undefined") return;

      try {
        posthog.capture("$feature_flag_called", {
          $feature_flag: flagName,
          $feature_flag_response: value,
        });
      } catch (error) {
        console.error("[Analytics] Failed to track feature flag:", error);
      }
    },
    []
  );

  // Pre-built tracking functions for common events
  const trackImageGeneration = useCallback(
    (
      status: "started" | "completed" | "failed",
      properties: {
        model: string;
        numberOfImages: number;
        creditCost: number;
        prompt?: string;
        width?: number;
        height?: number;
        stylePreset?: string;
        setId?: string;
        errorMessage?: string;
        generationTimeMs?: number;
      }
    ) => {
      const eventMap = {
        started: AnalyticsEvents.IMAGE_GENERATION_STARTED,
        completed: AnalyticsEvents.IMAGE_GENERATION_COMPLETED,
        failed: AnalyticsEvents.IMAGE_GENERATION_FAILED,
      };

      track(eventMap[status], {
        ...properties,
        promptLength: properties.prompt?.length,
      });
    },
    [track]
  );

  const trackVideoGeneration = useCallback(
    (
      status: "started" | "completed" | "failed",
      properties: {
        model: string;
        creditCost: number;
        prompt?: string;
        duration?: number;
        aspectRatio?: string;
        setId?: string;
        errorMessage?: string;
        generationTimeMs?: number;
      }
    ) => {
      const eventMap = {
        started: AnalyticsEvents.VIDEO_GENERATION_STARTED,
        completed: AnalyticsEvents.VIDEO_GENERATION_COMPLETED,
        failed: AnalyticsEvents.VIDEO_GENERATION_FAILED,
      };

      track(eventMap[status], {
        ...properties,
        promptLength: properties.prompt?.length,
      });
    },
    [track]
  );

  const trackLike = useCallback(
    (
      action: "like" | "unlike",
      targetType: "image" | "video",
      targetId: string,
      targetOwnerId?: string
    ) => {
      const eventMap = {
        image: {
          like: AnalyticsEvents.IMAGE_LIKED,
          unlike: AnalyticsEvents.IMAGE_UNLIKED,
        },
        video: {
          like: AnalyticsEvents.VIDEO_LIKED,
          unlike: AnalyticsEvents.VIDEO_UNLIKED,
        },
      };

      track(eventMap[targetType][action], {
        targetId,
        targetType,
        targetOwnerId,
      });
    },
    [track]
  );

  const trackComment = useCallback(
    (
      action: "created" | "deleted",
      targetType: "image" | "video",
      targetId: string,
      commentId?: string,
      messageLength?: number
    ) => {
      const eventMap = {
        image: {
          created: AnalyticsEvents.IMAGE_COMMENT_CREATED,
          deleted: AnalyticsEvents.IMAGE_COMMENT_DELETED,
        },
        video: {
          created: AnalyticsEvents.VIDEO_COMMENT_CREATED,
          deleted: AnalyticsEvents.VIDEO_COMMENT_DELETED,
        },
      };

      track(eventMap[targetType][action], {
        targetId,
        targetType,
        commentId,
        messageLength,
      });
    },
    [track]
  );

  const trackFollow = useCallback(
    (action: "follow" | "unfollow", targetUserId: string) => {
      const event =
        action === "follow"
          ? AnalyticsEvents.USER_FOLLOWED
          : AnalyticsEvents.USER_UNFOLLOWED;

      track(event, { targetUserId });
    },
    [track]
  );

  const trackCollection = useCallback(
    (
      action: "created" | "updated" | "deleted" | "image_added" | "image_removed",
      collectionId: string,
      properties?: {
        title?: string;
        imageCount?: number;
        imageId?: string;
      }
    ) => {
      const eventMap = {
        created: AnalyticsEvents.COLLECTION_CREATED,
        updated: AnalyticsEvents.COLLECTION_UPDATED,
        deleted: AnalyticsEvents.COLLECTION_DELETED,
        image_added: AnalyticsEvents.COLLECTION_IMAGE_ADDED,
        image_removed: AnalyticsEvents.COLLECTION_IMAGE_REMOVED,
      };

      track(eventMap[action], {
        collectionId,
        ...properties,
      });
    },
    [track]
  );

  const trackSearch = useCallback(
    (properties: {
      searchTerm?: string;
      mediaType?: string;
      model?: string;
      page?: number;
      resultsCount?: number;
    }) => {
      track(AnalyticsEvents.SEARCH_PERFORMED, properties);
    },
    [track]
  );

  const trackModelSelected = useCallback(
    (model: string, context: "image" | "video") => {
      track(AnalyticsEvents.MODEL_SELECTED, { model, context });
    },
    [track]
  );

  return {
    // Core functions
    track,
    identify,
    reset,
    setUserProperties,
    trackFeatureFlag,

    // Pre-built tracking functions
    trackImageGeneration,
    trackVideoGeneration,
    trackLike,
    trackComment,
    trackFollow,
    trackCollection,
    trackSearch,
    trackModelSelected,

    // Event names for reference
    events: AnalyticsEvents,
  };
}

export default useAnalytics;
