import { Link } from "@remix-run/react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODEL_OPTIONS } from "~/routes/create";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RemixBadgeProps {
  parentImageId?: string | null;
  parentModel?: string | null;
  size?: "sm" | "md";
  showLink?: boolean;
  className?: string;
}

/**
 * A badge component that indicates an image was remixed from another image.
 * Shows the parent model and optionally links to the original image.
 */
export const RemixBadge = ({
  parentImageId,
  parentModel,
  size = "md",
  showLink = true,
  className,
}: RemixBadgeProps) => {
  // Get the display name of the parent model
  const parentModelName =
    MODEL_OPTIONS.find((m) => m.value === parentModel)?.name || parentModel || "Unknown";

  const badgeContent = (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/20 to-rose-500/20 border border-purple-500/30 text-purple-300",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      <Shuffle className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      <span className="font-medium">Remixed</span>
    </div>
  );

  if (showLink && parentImageId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={`/explore/${parentImageId}`}
              className="hover:opacity-80 transition-opacity"
              prefetch="intent"
            >
              {badgeContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
            <p className="text-sm">
              Remixed from an image generated with <span className="font-medium">{parentModelName}</span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">Click to view original</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
          <p className="text-sm">
            Remixed from an image generated with <span className="font-medium">{parentModelName}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
