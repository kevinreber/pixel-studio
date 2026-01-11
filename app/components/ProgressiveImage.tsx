import { useState, useCallback } from "react";
import { fallbackImageSource } from "~/client";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  blurSrc?: string | null;
  className?: string;
  containerClassName?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * ProgressiveImage - A component that shows a blur placeholder while the full image loads.
 *
 * How it works:
 * 1. If blurSrc is provided, it shows immediately as a blurred background
 * 2. The full image loads in the foreground with opacity 0
 * 3. Once loaded, the full image fades in over the blur
 * 4. Falls back gracefully if no blurSrc exists (shows loading skeleton)
 */
export const ProgressiveImage = ({
  src,
  alt,
  blurSrc,
  className,
  containerClassName,
  onError,
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blurError, setBlurError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

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
    // Blur image doesn't exist (old images before Lambda update)
    // Just hide the blur and let skeleton show
    setBlurError(true);
  }, []);

  const showBlur = blurSrc && !isLoaded && !blurError;
  const showSkeleton = !showBlur && !isLoaded && !hasError;

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
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

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
};

export default ProgressiveImage;
