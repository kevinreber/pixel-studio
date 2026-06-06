import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Redesign Button — variants/sizes per design_handoff README.
 * - primary fills with accent + glow
 * - soft uses accent-soft tint
 * - ghost has no background (raised on hover)
 * - sizes sm/md/lg + icon/iconSm squares
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm",
    "font-sans font-semibold leading-none",
    "border border-transparent",
    "transition-[background,border-color,color,transform,box-shadow] duration-150 ease-ps",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] shadow-glow hover:bg-[var(--accent-hover)] hover:-translate-y-px active:bg-[var(--accent-press)]",
        secondary:
          "bg-surface-2 text-fg border-border-strong hover:bg-surface-hover hover:border-fg-faint",
        ghost: "bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
        soft:
          "bg-accent-soft text-[var(--accent-text)] border-border-accent hover:border-[var(--accent)]",
        danger:
          "bg-danger-soft text-danger hover:border-danger",
        outline:
          "bg-transparent text-fg border-border-strong hover:bg-surface-2 hover:border-fg-faint",
      },
      size: {
        sm: "h-8 px-[11px] text-[13px]",
        md: "h-[38px] px-[15px] text-[14px]",
        lg: "h-[46px] px-[22px] text-[15px]",
        icon: "h-[38px] w-[38px] p-0",
        iconSm: "h-8 w-8 p-0",
      },
      active: {
        true: "bg-surface-2 text-fg",
        false: "",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
      active: false,
    },
  },
);

export interface PsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, PsButtonProps>(
  (
    { className, variant, size, active, icon, iconRight, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, active }), className)}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  },
);
Button.displayName = "PsButton";

export { buttonVariants };
