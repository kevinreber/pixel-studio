import { PostHog } from "posthog-node";

// Initialize PostHog server-side client
let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY) {
    return null;
  }

  if (!posthogClient) {
    // Use batching in production for better performance
    const isDevelopment = process.env.NODE_ENV === "development";
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
      // In dev: send immediately for debugging. In prod: batch for performance
      flushAt: isDevelopment ? 1 : 20,
      flushInterval: isDevelopment ? 0 : 10000, // 10 seconds in production
    });
  }

  return posthogClient;
}

// ============================================
// EVENT NAMES - Centralized event definitions
// ============================================

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

  // Errors
  ERROR_OCCURRED: "error_occurred",
} as const;

export type AnalyticsEvent =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

// ============================================
// EVENT PROPERTY TYPES
// ============================================

export interface BaseEventProperties {
  timestamp?: string;
}

export interface AuthEventProperties extends BaseEventProperties {
  provider?: string;
  isNewUser?: boolean;
}

export interface ImageGenerationEventProperties extends BaseEventProperties {
  // Note: We intentionally do NOT track the full prompt for privacy reasons
  // Only track the length to understand usage patterns without storing user content
  promptLength?: number;
  model: string;
  numberOfImages: number;
  width?: number;
  height?: number;
  stylePreset?: string;
  creditCost: number;
  isAsync?: boolean;
  setId?: string;
}

export interface VideoGenerationEventProperties extends BaseEventProperties {
  // Note: We intentionally do NOT track the full prompt for privacy reasons
  promptLength?: number;
  model: string;
  duration?: number;
  aspectRatio?: string;
  creditCost: number;
  sourceImageId?: string;
  setId?: string;
}

// Input types that accept prompt (will be converted to promptLength)
export interface ImageGenerationInput {
  prompt?: string;
  model: string;
  numberOfImages: number;
  width?: number;
  height?: number;
  stylePreset?: string;
  creditCost: number;
  isAsync?: boolean;
  setId?: string;
}

export interface VideoGenerationInput {
  prompt?: string;
  model: string;
  duration?: number;
  aspectRatio?: string;
  creditCost: number;
  sourceImageId?: string;
  setId?: string;
}

export interface EngagementEventProperties extends BaseEventProperties {
  targetId: string;
  targetType: "image" | "video" | "comment";
  targetOwnerId?: string;
}

export interface CommentEventProperties extends BaseEventProperties {
  targetId: string;
  targetType: "image" | "video";
  commentId?: string;
  messageLength?: number;
  parentCommentId?: string;
}

export interface CollectionEventProperties extends BaseEventProperties {
  collectionId: string;
  title?: string;
  description?: string;
  isPublic?: boolean;
  imageCount?: number;
}

export interface SocialEventProperties extends BaseEventProperties {
  targetUserId: string;
  targetUsername?: string;
}

export interface PaymentEventProperties extends BaseEventProperties {
  amount?: number;
  credits?: number;
  currency?: string;
  stripeSessionId?: string;
  productId?: string;
}

export interface SearchEventProperties extends BaseEventProperties {
  searchTerm?: string;
  mediaType?: string;
  model?: string;
  page?: number;
  pageSize?: number;
  resultsCount?: number;
}

export interface PageViewEventProperties extends BaseEventProperties {
  pageName: string;
  path: string;
  referrer?: string;
}

export interface ErrorEventProperties extends BaseEventProperties {
  errorMessage: string;
  errorCode?: string;
  errorStack?: string;
  context?: string;
}

// Union type for all event properties
export type EventProperties =
  | AuthEventProperties
  | ImageGenerationEventProperties
  | VideoGenerationEventProperties
  | EngagementEventProperties
  | CommentEventProperties
  | CollectionEventProperties
  | SocialEventProperties
  | PaymentEventProperties
  | SearchEventProperties
  | PageViewEventProperties
  | ErrorEventProperties
  | BaseEventProperties;

// ============================================
// SERVER-SIDE TRACKING FUNCTIONS
// ============================================

/**
 * Track an event from the server side
 */
export function trackEvent(
  userId: string,
  event: AnalyticsEvent,
  properties?: EventProperties
): void {
  const client = getPostHogClient();
  if (!client) {
    // Log in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Event (no client):", event, {
        userId,
        ...properties,
      });
    }
    return;
  }

  try {
    client.capture({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: properties?.timestamp || new Date().toISOString(),
        $set: {
          lastActiveAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Identify a user with their properties
 */
export function identifyUser(
  userId: string,
  properties: {
    email?: string;
    name?: string;
    username?: string;
    avatar?: string;
    createdAt?: string;
    provider?: string;
  }
): void {
  const client = getPostHogClient();
  if (!client) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Identify (no client):", userId, properties);
    }
    return;
  }

  try {
    client.identify({
      distinctId: userId,
      properties: {
        email: properties.email,
        name: properties.name,
        username: properties.username,
        avatar: properties.avatar,
        createdAt: properties.createdAt,
        provider: properties.provider,
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to identify user:", error);
  }
}

/**
 * Track user sign up
 */
export function trackUserSignUp(
  userId: string,
  properties: AuthEventProperties
): void {
  trackEvent(userId, AnalyticsEvents.USER_SIGNED_UP, properties);
}

/**
 * Track user login
 */
export function trackUserLogin(
  userId: string,
  properties: AuthEventProperties
): void {
  trackEvent(userId, AnalyticsEvents.USER_LOGGED_IN, properties);
}

/**
 * Track user logout
 */
export function trackUserLogout(userId: string): void {
  trackEvent(userId, AnalyticsEvents.USER_LOGGED_OUT, {});
}

/**
 * Strip prompt from properties and convert to promptLength for privacy
 */
function sanitizeImageGenerationProps(
  input: ImageGenerationInput
): ImageGenerationEventProperties {
  const { prompt, ...rest } = input;
  return {
    ...rest,
    promptLength: prompt?.length,
  };
}

function sanitizeVideoGenerationProps(
  input: VideoGenerationInput
): VideoGenerationEventProperties {
  const { prompt, ...rest } = input;
  return {
    ...rest,
    promptLength: prompt?.length,
  };
}

/**
 * Track image generation started
 */
export function trackImageGenerationStarted(
  userId: string,
  properties: ImageGenerationInput
): void {
  trackEvent(
    userId,
    AnalyticsEvents.IMAGE_GENERATION_STARTED,
    sanitizeImageGenerationProps(properties)
  );
}

/**
 * Track image generation completed
 */
export function trackImageGenerationCompleted(
  userId: string,
  properties: ImageGenerationInput & { generationTimeMs?: number }
): void {
  const { generationTimeMs, ...rest } = properties;
  trackEvent(userId, AnalyticsEvents.IMAGE_GENERATION_COMPLETED, {
    ...sanitizeImageGenerationProps(rest),
    generationTimeMs,
  } as ImageGenerationEventProperties & { generationTimeMs?: number });
}

/**
 * Track image generation failed
 */
export function trackImageGenerationFailed(
  userId: string,
  properties: ImageGenerationInput & {
    errorMessage?: string;
    errorCode?: string;
  }
): void {
  const { errorMessage, errorCode, ...rest } = properties;
  trackEvent(userId, AnalyticsEvents.IMAGE_GENERATION_FAILED, {
    ...sanitizeImageGenerationProps(rest),
    errorMessage,
    errorCode,
  } as ImageGenerationEventProperties & {
    errorMessage?: string;
    errorCode?: string;
  });
}

/**
 * Track video generation started
 */
export function trackVideoGenerationStarted(
  userId: string,
  properties: VideoGenerationInput
): void {
  trackEvent(
    userId,
    AnalyticsEvents.VIDEO_GENERATION_STARTED,
    sanitizeVideoGenerationProps(properties)
  );
}

/**
 * Track video generation completed
 */
export function trackVideoGenerationCompleted(
  userId: string,
  properties: VideoGenerationInput & { generationTimeMs?: number }
): void {
  const { generationTimeMs, ...rest } = properties;
  trackEvent(userId, AnalyticsEvents.VIDEO_GENERATION_COMPLETED, {
    ...sanitizeVideoGenerationProps(rest),
    generationTimeMs,
  } as VideoGenerationEventProperties & { generationTimeMs?: number });
}

/**
 * Track video generation failed
 */
export function trackVideoGenerationFailed(
  userId: string,
  properties: VideoGenerationInput & {
    errorMessage?: string;
    errorCode?: string;
  }
): void {
  const { errorMessage, errorCode, ...rest } = properties;
  trackEvent(userId, AnalyticsEvents.VIDEO_GENERATION_FAILED, {
    ...sanitizeVideoGenerationProps(rest),
    errorMessage,
    errorCode,
  } as VideoGenerationEventProperties & {
    errorMessage?: string;
    errorCode?: string;
  });
}

/**
 * Track engagement actions (likes)
 */
export function trackEngagement(
  userId: string,
  event: AnalyticsEvent,
  properties: EngagementEventProperties
): void {
  trackEvent(userId, event, properties);
}

/**
 * Track comment actions
 */
export function trackComment(
  userId: string,
  event: AnalyticsEvent,
  properties: CommentEventProperties
): void {
  trackEvent(userId, event, properties);
}

/**
 * Track collection actions
 */
export function trackCollection(
  userId: string,
  event: AnalyticsEvent,
  properties: CollectionEventProperties
): void {
  trackEvent(userId, event, properties);
}

/**
 * Track social actions (follow/unfollow)
 */
export function trackSocial(
  userId: string,
  event: AnalyticsEvent,
  properties: SocialEventProperties
): void {
  trackEvent(userId, event, properties);
}

/**
 * Track payment events
 */
export function trackPayment(
  userId: string,
  event: AnalyticsEvent,
  properties: PaymentEventProperties
): void {
  trackEvent(userId, event, properties);
}

/**
 * Track credits spent
 */
export function trackCreditsSpent(
  userId: string,
  credits: number,
  context: string
): void {
  trackEvent(userId, AnalyticsEvents.CREDITS_SPENT, {
    credits,
    context,
  } as PaymentEventProperties & { context: string });
}

/**
 * Track search performed
 */
export function trackSearch(
  userId: string,
  properties: SearchEventProperties
): void {
  trackEvent(userId, AnalyticsEvents.SEARCH_PERFORMED, properties);
}

/**
 * Track page view
 */
export function trackPageView(
  userId: string,
  properties: PageViewEventProperties
): void {
  trackEvent(userId, AnalyticsEvents.PAGE_VIEWED, properties);
}

/**
 * Track error occurred
 */
export function trackError(
  userId: string,
  properties: ErrorEventProperties
): void {
  trackEvent(userId, AnalyticsEvents.ERROR_OCCURRED, properties);
}

/**
 * Shutdown PostHog client (call on server shutdown)
 */
export async function shutdownAnalytics(): Promise<void> {
  const client = getPostHogClient();
  if (client) {
    await client.shutdown();
  }
}
