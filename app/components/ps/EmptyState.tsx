import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center text-center",
        compact ? "px-5 py-12" : "px-5 py-[76px]",
        className,
      )}
    >
      <div className="mb-[18px] grid h-[60px] w-[60px] place-items-center rounded-lg border border-border-accent bg-accent-soft text-[var(--accent-text)]">
        {icon ?? <Sparkles className="h-[27px] w-[27px]" strokeWidth={1.8} />}
      </div>
      <h3 className="m-0 mb-2 text-lg font-semibold">{title}</h3>
      {subtitle && (
        <p className="m-0 max-w-[360px] text-sm leading-[1.55] text-fg-muted">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
