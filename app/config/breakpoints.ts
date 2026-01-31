/**
 * Responsive breakpoint constants
 * These match Tailwind CSS default breakpoints for consistency
 *
 * Usage in JavaScript:
 * ```ts
 * import { BREAKPOINTS } from "~/config/breakpoints";
 *
 * const isMobile = window.innerWidth < BREAKPOINTS.md;
 * ```
 *
 * For CSS, prefer using Tailwind's responsive utilities:
 * - sm:  640px  - @media (min-width: 640px)
 * - md:  768px  - @media (min-width: 768px)
 * - lg:  1024px - @media (min-width: 1024px)
 * - xl:  1280px - @media (min-width: 1280px)
 * - 2xl: 1536px - @media (min-width: 1536px)
 */

/** Breakpoint values in pixels */
export const BREAKPOINTS = {
  /** Small screens (mobile landscape) - 640px */
  sm: 640,
  /** Medium screens (tablets) - 768px */
  md: 768,
  /** Large screens (small laptops) - 1024px */
  lg: 1024,
  /** Extra large screens (desktops) - 1280px */
  xl: 1280,
  /** 2x extra large screens (large desktops) - 1536px */
  "2xl": 1536,
} as const;

/** Type for breakpoint names */
export type BreakpointName = keyof typeof BREAKPOINTS;

/** Mobile breakpoint - screens smaller than this are considered mobile */
export const MOBILE_BREAKPOINT = BREAKPOINTS.md;

/** Tablet breakpoint - screens between md and lg */
export const TABLET_BREAKPOINT = BREAKPOINTS.lg;

/**
 * Media query strings for use in JavaScript
 * Use with window.matchMedia() or in CSS-in-JS solutions
 */
export const MEDIA_QUERIES = {
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]}px)`,
  /** Targets mobile devices (below md breakpoint) */
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  /** Targets tablet devices (md to lg) */
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  /** Targets desktop devices (lg and above) */
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  /** User prefers reduced motion */
  reducedMotion: "(prefers-reduced-motion: reduce)",
  /** User prefers dark color scheme */
  darkMode: "(prefers-color-scheme: dark)",
} as const;

/**
 * Helper to check if current viewport is below a breakpoint
 * Only works client-side
 *
 * @param breakpoint - The breakpoint to check against
 * @returns true if viewport is smaller than the breakpoint
 */
export function isBelowBreakpoint(breakpoint: BreakpointName): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < BREAKPOINTS[breakpoint];
}

/**
 * Helper to check if current viewport is at or above a breakpoint
 * Only works client-side
 *
 * @param breakpoint - The breakpoint to check against
 * @returns true if viewport is at or larger than the breakpoint
 */
export function isAboveBreakpoint(breakpoint: BreakpointName): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}
