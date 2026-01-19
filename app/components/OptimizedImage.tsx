import { useState, useCallback, useRef, useEffect } from "react";
import { fallbackImageSource } from "~/client";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  blurSrc?: string | null;
  thumbnailSrc?: string | null;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  rootMargin?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: () => void;
}

/**
 * OptimizedImage - High-performance image component with smart lazy loading.
 *
 * Features:
 * - IntersectionObserver-based lazy loading with configurable rootMargin
 * - Progressive loading: blur → thumbnail → full image
 * - Priority loading for above-the-fold images
 * - Smooth fade-in transitions
 * - Graceful error handling with fallback
 */
export const OptimizedImage = ({
  src,
  alt,
  blurSrc,
  thumbnailSrc,
  className,
  containerClassName,
  priority = false,
  rootMargin = "200px", // Start loading 200px before entering viewport
  onError,
  onLoad,
}: OptimizedImageProps) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blurError, setBlurError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for smart lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [priority, isInView, rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      setIsLoaded(true);
      if (onError) {
        onError(e);
      } else {
        e.currentTarget.src = fallbackImageSource;
      }
    },
    [onError]
  );

  const handleBlurError = useCallback(() => {
    setBlurError(true);
  }, []);

  const showBlur = blurSrc && !isLoaded && !blurError;
  const showSkeleton = !showBlur && !isLoaded && !hasError;

  // Determine which source to load
  const loadSrc = thumbnailSrc || src;

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", containerClassName)}>
      {/* Blur placeholder layer */}
      {showBlur && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          onError={handleBlurError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover scale-110 blur-xl",
            className
          )}
        />
      )}

      {/* Loading skeleton when no blur placeholder */}
      {showSkeleton && (
        <div
          className={cn(
            "absolute inset-0 bg-zinc-800 animate-pulse",
            className
          )}
        />
      )}

      {/* Main image - only render when in view */}
      {isInView && (
        <img
          src={loadSrc}
          alt={alt}
          decoding={priority ? "sync" : "async"}
          // Use spread to pass fetchpriority as lowercase (React doesn't recognize camelCase version)
          {...{ fetchpriority: priority ? "high" : "auto" }}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
