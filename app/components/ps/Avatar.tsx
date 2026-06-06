import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
  alt?: string;
}

/**
 * Avatar — circular; gradient fallback derived from name hash when no image.
 * `ring` adds a 2px bg gap and a 1.5px accent ring (used for active account chip / story badge).
 */
export function Avatar({
  name,
  src,
  size = 36,
  ring,
  className,
  alt,
}: AvatarProps) {
  const initial = (name || "?").trim().slice(0, 1).toUpperCase();
  const hue =
    ((name || "")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) *
      47) %
    360;
  const fallback = `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${
    (hue + 40) % 360
  } 70% 45%))`;

  return (
    <div
      className={cn(
        "grid flex-shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: src ? undefined : fallback,
        boxShadow: ring
          ? "0 0 0 2px var(--bg), 0 0 0 3.5px var(--accent)"
          : undefined,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || ""}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        initial
      )}
    </div>
  );
}
