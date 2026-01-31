import { useState, useEffect } from "react";
import { MEDIA_QUERIES } from "~/config/breakpoints";

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects the `prefers-reduced-motion: reduce` media query.
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <div className={prefersReducedMotion ? "" : "animate-bounce"}>
 *     Content
 *   </div>
 * );
 * ```
 *
 * @returns true if the user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
  // Default to false on server, will be updated on client
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(MEDIA_QUERIES.reducedMotion);

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Use addEventListener for modern browsers
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Helper to get animation classes based on reduced motion preference.
 * Returns the animation class only if reduced motion is not preferred.
 *
 * Usage:
 * ```tsx
 * const animationClass = useAnimationClass("animate-spin", "");
 * // Returns "animate-spin" if motion is OK, "" if reduced motion preferred
 *
 * return <div className={animationClass}>Loading...</div>;
 * ```
 *
 * @param animationClass - The animation class to use when motion is OK
 * @param fallbackClass - The class to use when reduced motion is preferred
 * @returns The appropriate class based on user preference
 */
export function useAnimationClass(
  animationClass: string,
  fallbackClass = ""
): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallbackClass : animationClass;
}

export default useReducedMotion;
