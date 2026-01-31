/**
 * Skeleton loading components for various UI patterns
 * These provide a better loading experience than spinners by matching the content layout
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Props for skeleton components */
export interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton for a notification item
 * Matches the layout of NotificationItem component
 */
export function NotificationItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3", className)}>
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a list of notification items
 */
export function NotificationListSkeleton({
  count = 5,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("divide-y divide-zinc-800", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for an image card
 * Matches the layout of ImageCard component
 */
export function ImageCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("relative w-full pt-[100%]", className)}>
      <Skeleton className="absolute inset-0 rounded-md" />
    </div>
  );
}

/**
 * Skeleton for a grid of image cards
 */
export function ImageGridSkeleton({
  count = 9,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ImageCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a video card
 * Matches the layout of VideoCard component
 */
export function VideoCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("relative w-full pt-[100%]", className)}>
      <Skeleton className="absolute inset-0 rounded-md" />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a user profile header
 */
export function ProfileHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Avatar */}
      <Skeleton className="h-20 w-20 rounded-full" />
      {/* Info */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-4 mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for a comment
 */
export function CommentSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a list of comments
 */
export function CommentListSkeleton({
  count = 3,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a model selection card
 */
export function ModelCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      {/* Image */}
      <Skeleton className="h-32 w-full rounded-md mb-4" />
      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-2" />
      {/* Badges */}
      <div className="flex gap-2 mb-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </div>
  );
}

/**
 * Skeleton for the model grid on create page
 */
export function ModelGridSkeleton({
  count = 6,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Generic text block skeleton
 */
export function TextBlockSkeleton({
  lines = 3,
  className,
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for a stat card
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
