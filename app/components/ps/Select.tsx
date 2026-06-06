import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PsSelectOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface PsSelectProps<T extends string> {
  value: T;
  options: (T | PsSelectOption<T>)[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  width?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Lightweight custom dropdown matching the prototype's Select primitive.
 * Closes on outside click; renders an absolute popover with `shadow-pop`.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  icon,
  width,
  className,
  placeholder,
}: PsSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resolve = (
    o: T | PsSelectOption<T>,
  ): { value: T; label: React.ReactNode } =>
    typeof o === "string"
      ? { value: o as T, label: o as React.ReactNode }
      : (o as PsSelectOption<T>);

  const current = options.find((o) => resolve(o).value === value);
  const currentLabel = current
    ? resolve(current).label
    : placeholder || (value as React.ReactNode);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      style={width ? { width } : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[38px] w-full items-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-3 font-sans text-[13.5px] font-medium text-fg"
      >
        {icon && <span className="text-fg-subtle">{icon}</span>}
        <span className="flex-1 whitespace-nowrap text-left">
          {currentLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-[15px] w-[15px] text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="anim-pop absolute left-0 top-[calc(100%+6px)] z-50 max-h-[280px] min-w-full overflow-y-auto rounded-md border border-border-strong bg-surface-2 p-[5px] shadow-pop">
          {options.map((o) => {
            const { value: v, label } = resolve(o);
            const on = v === value;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 whitespace-nowrap rounded-xs border-none px-2.5 py-2 text-left font-sans text-[13.5px]",
                  on
                    ? "bg-accent-soft font-semibold text-[var(--accent-text)]"
                    : "bg-transparent font-medium text-fg hover:bg-surface-hover",
                )}
              >
                <span className="flex-1">{label}</span>
                {on && <Check className="h-[15px] w-[15px]" strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
