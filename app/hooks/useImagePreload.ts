import { useCallback, useRef } from "react";

// Cache to track which images have been preloaded
const preloadedImages = new Set<string>();

/**
 * Hook for preloading images on hover/focus.
 *
 * Usage:
 * ```tsx
 * const { preloadImage, getPreloadHandlers } = useImagePreload();
 *
 * // Option 1: Manual preload
 * <div onMouseEnter={() => preloadImage(fullImageUrl)}>
 *
 * // Option 2: Use handlers
 * <div {...getPreloadHandlers(fullImageUrl)}>
 * ```
 */
export const useImagePreload = () => {
  const preloadingRef = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string | null | undefined) => {
    if (!src) return;

    // Skip if already preloaded or currently preloading
    if (preloadedImages.has(src) || preloadingRef.current.has(src)) {
      return;
    }

    preloadingRef.current.add(src);

    const img = new Image();
    img.onload = () => {
      preloadedImages.add(src);
      preloadingRef.current.delete(src);
    };
    img.onerror = () => {
      preloadingRef.current.delete(src);
    };
    img.src = src;
  }, []);

  const preloadImages = useCallback((srcs: (string | null | undefined)[]) => {
    srcs.forEach((src) => preloadImage(src));
  }, [preloadImage]);

  // Get handlers for attaching to elements
  const getPreloadHandlers = useCallback(
    (src: string | null | undefined) => ({
      onMouseEnter: () => preloadImage(src),
      onFocus: () => preloadImage(src),
    }),
    [preloadImage]
  );

  return {
    preloadImage,
    preloadImages,
    getPreloadHandlers,
    isPreloaded: (src: string) => preloadedImages.has(src),
  };
};

/**
 * Preload an image imperatively (outside React components).
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (preloadedImages.has(src)) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      preloadedImages.add(src);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Preload multiple images with optional concurrency limit.
 */
export const preloadImages = async (
  srcs: string[],
  concurrency = 3
): Promise<void> => {
  const queue = [...srcs];
  const workers: Promise<void>[] = [];

  const worker = async () => {
    while (queue.length > 0) {
      const src = queue.shift();
      if (src) {
        try {
          await preloadImage(src);
        } catch {
          // Continue with other images on error
        }
      }
    }
  };

  for (let i = 0; i < Math.min(concurrency, srcs.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
};

export default useImagePreload;
