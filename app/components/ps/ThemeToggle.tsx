import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ps-theme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  // Best-effort persist to the authed user's profile.
  // Anon users get a 401 which is silently ignored — localStorage is enough.
  if (typeof fetch !== "undefined") {
    const body = new FormData();
    body.set("theme", theme);
    fetch("/api/preferences/theme", {
      method: "POST",
      body,
      credentials: "same-origin",
    }).catch(() => {
      /* ignore — UI already updated */
    });
  }
}

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const fromAttr = document.documentElement.getAttribute("data-theme") as
    | Theme
    | null;
  if (fromAttr === "dark" || fromAttr === "light") return fromAttr;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function useTheme(): [Theme, (next?: Theme) => void] {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    setTheme(readInitialTheme());
  }, []);

  const set = React.useCallback((next?: Theme) => {
    setTheme((prev) => {
      const value = next ?? (prev === "dark" ? "light" : "dark");
      applyTheme(value);
      return value;
    });
  }, []);

  return [theme, set];
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2} />
      )}
    </button>
  );
}
