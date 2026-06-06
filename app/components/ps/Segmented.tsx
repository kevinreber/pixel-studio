import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const pillH = size === "sm" ? "h-6" : "h-[30px]";
  const fontSize = size === "sm" ? "text-[12.5px]" : "text-[13.5px]";
  return (
    <div
      className={cn(
        "inline-flex gap-0.5 rounded-sm border border-[var(--border)] bg-surface-inset p-[3px]",
        className,
      )}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[7px] px-3 font-sans font-semibold transition-all duration-150 ease-ps",
              pillH,
              fontSize,
              on
                ? "bg-surface-3 text-fg shadow-sm"
                : "bg-transparent text-fg-subtle hover:text-fg",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
