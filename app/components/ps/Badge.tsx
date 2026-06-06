import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold leading-[1.3] border",
  {
    variants: {
      tone: {
        neutral: "bg-surface-3 text-fg-muted border-[var(--border)]",
        accent: "bg-accent-soft text-[var(--accent-text)] border-border-accent",
        success: "bg-success-soft text-success border-transparent",
        warning: "bg-warning-soft text-warning border-transparent",
        danger: "bg-danger-soft text-danger border-transparent",
        info: "bg-info-soft text-info border-transparent",
      },
      mono: {
        true: "font-mono",
        false: "font-sans",
      },
    },
    defaultVariants: {
      tone: "neutral",
      mono: false,
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({
  className,
  tone,
  mono,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, mono }), className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
