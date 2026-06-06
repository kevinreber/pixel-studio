import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-[26px] flex flex-wrap items-end justify-between gap-6",
        className,
      )}
    >
      <div className="flex items-center gap-[14px]">
        {icon && (
          <div className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-md border border-border-accent bg-accent-soft text-[var(--accent-text)]">
            {icon}
          </div>
        )}
        <div>
          <h1 className="m-0 text-[25px] font-bold leading-[1.1] tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mt-[5px] text-sm text-fg-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
