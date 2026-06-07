import * as React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArtTileProps {
  src?: string | null;
  /**
   * Optional fallback URL the tile retries when `src` fails to load (404, 403,
   * CORS, etc.). Use the original / full-size URL here when `src` is the
   * thumbnail, so a missing thumbnail still shows the real image.
   */
  fallbackSrc?: string | null;
  alt?: string;
  /** When true, overlays a center play badge */
  isVideo?: boolean;
  /**
   * Optional aspect ratio (height / width). Used while the image is still
   * loading (or if it never loads) so the tile keeps a visible click target
   * instead of collapsing to 0px.
   * Default: 1 (square). Pass 0 to opt out of any fallback aspect.
   */
  aspectRatio?: number;
  /** Tailwind rounded-* override; default `rounded-md`. Pass empty string to disable. */
  radius?: string;
  /**
   * Above-the-fold tiles should set this. Switches to eager loading with high
   * fetch priority so the browser starts the request immediately instead of
   * waiting for an IntersectionObserver tick — otherwise the opacity-0
   * placeholder hides the real image for an uncomfortably long moment.
   */
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ArtTile — every gallery's atom.
 * Background = mesh-gradient fallback (kept visible behind the img so loading state never shows blank).
 * Foreground = <img object-cover>, animated in via transform only.
 *
 * Once the image decodes its natural dimensions take over (the wrapper grows
 * to the image's height because object-cover preserves aspect). Until then we
 * lock in a fallback aspect so the tile is clickable and visible.
 *
 * On error: tries `fallbackSrc` (if provided and different from src) before
 * giving up and showing the mesh placeholder.
 */
export function ArtTile({
  src,
  fallbackSrc,
  alt = "",
  isVideo,
  aspectRatio = 1,
  radius = "rounded-md",
  priority = false,
  className,
  children,
}: ArtTileProps) {
  // Track which URL we're actively trying (thumbnail vs fallback) so the
  // onError handler can advance to the next candidate without React re-running
  // useState in an infinite loop.
  const [currentSrc, setCurrentSrc] = React.useState<string | null>(src ?? null);
  const [status, setStatus] = React.useState<"pending" | "loaded" | "error">(
    "pending",
  );
  const triedFallback = React.useRef(false);

  React.useEffect(() => {
    // src prop changed (different tile mounted, or filter swap) — reset.
    setCurrentSrc(src ?? null);
    setStatus("pending");
    triedFallback.current = false;
  }, [src]);

  const handleError = () => {
    if (
      !triedFallback.current &&
      fallbackSrc &&
      fallbackSrc !== currentSrc
    ) {
      triedFallback.current = true;
      setCurrentSrc(fallbackSrc);
      setStatus("pending");
    } else {
      setStatus("error");
    }
  };

  const useAspect =
    aspectRatio > 0 && (status !== "loaded" || !currentSrc);

  return (
    <div
      className={cn("relative overflow-hidden", radius, className)}
      style={useAspect ? { aspectRatio: `1 / ${aspectRatio}` } : undefined}
    >
      {/* mesh-gradient placeholder — always behind the image so there is no flash */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(109,94,252,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(255,90,160,0.28), transparent 55%), linear-gradient(135deg,#1b1830,#0c0c1b)",
        }}
      />
      {currentSrc && status !== "error" && (
        <img
          src={currentSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={handleError}
          className={cn(
            useAspect
              ? "absolute inset-0 h-full w-full object-cover"
              : "relative h-full w-full object-cover",
            "transition-opacity duration-200",
            status === "loaded" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {isVideo && (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex h-[26px] items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 text-[11px] font-semibold text-white backdrop-blur">
          <Play className="h-3 w-3" strokeWidth={2.4} />
          Video
        </div>
      )}
      {children}
    </div>
  );
}
