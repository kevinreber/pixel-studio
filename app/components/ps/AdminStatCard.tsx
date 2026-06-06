import * as React from "react";
import { cn } from "@/lib/utils";

type StatTone = "info" | "success" | "warning" | "danger" | "accent";

const STAT_TONE_TILE: Record<StatTone, string> = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-[var(--accent-text)]",
};

interface AdminStatCardProps {
  label: string;
  value: number | string;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  tone?: StatTone;
  trend?: { value: string; direction: "up" | "down" };
  className?: string;
}

/**
 * Admin Overview / sub-tab stat card.
 * Mono numbers, u-label title, tone-tile glyph, optional trend delta.
 * Shared across admin pages so they look like one dashboard.
 */
export function AdminStatCard({
  label,
  value,
  sub,
  icon,
  tone = "accent",
  trend,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-surface-1 p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="u-label">{label}</span>
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-sm",
            STAT_TONE_TILE[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mono text-[28px] font-bold leading-none tracking-[-0.02em] text-fg">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {(trend || sub) && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-fg-subtle">
          {trend && (
            <span
              className={cn(
                "mono font-semibold",
                trend.direction === "up" ? "text-success" : "text-danger",
              )}
            >
              {trend.direction === "up" ? "▲" : "▼"} {trend.value}
            </span>
          )}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}
