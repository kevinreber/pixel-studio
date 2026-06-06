import * as React from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Compass,
  Rss,
  Heart,
  User,
  Plus,
  Menu,
  X,
  Users,
  Video,
  Layers,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { useTheme } from "./ThemeToggle";
import PixelStudioIcon from "components/PixelStudioIcon";
import { NotificationDropdown } from "../NotificationDropdown";

interface MobileNavProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    credits: number;
  } | null;
  isAdmin: boolean;
}

interface BottomTab {
  label: string;
  href: string;
  icon: React.ReactNode;
  match: (p: string) => boolean;
}

export function MobileNav({ user, isAdmin }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [theme, setTheme] = useTheme();
  const loc = useLocation();
  const path = loc.pathname;
  const isLoggedIn = !!user;

  const tabs: BottomTab[] = [
    {
      label: "Explore",
      href: "/explore",
      icon: <Compass className="h-[22px] w-[22px]" strokeWidth={2} />,
      match: (p) => p.startsWith("/explore"),
    },
    {
      label: "Feed",
      href: "/feed",
      icon: <Rss className="h-[22px] w-[22px]" strokeWidth={2} />,
      match: (p) => p.startsWith("/feed"),
    },
    {
      label: "Liked",
      href: "/likes",
      icon: <Heart className="h-[22px] w-[22px]" strokeWidth={2} />,
      match: (p) => p.startsWith("/likes"),
    },
    {
      label: "Profile",
      href: user?.id ? `/profile/${user.id}` : "/login",
      icon: <User className="h-[22px] w-[22px]" strokeWidth={2} />,
      match: (p) => p.startsWith("/profile"),
    },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <Menu className="h-[20px] w-[20px]" strokeWidth={2} />
        </button>
        <Link to="/" prefetch="intent" className="flex items-center gap-2">
          <div className="h-7 w-7">
            <PixelStudioIcon />
          </div>
          <span className="text-base font-bold tracking-tight">Pixel Studio</span>
        </Link>
        <div className="flex items-center">
          {isLoggedIn ? (
            <NotificationDropdown />
          ) : (
            <div className="h-9 w-9" aria-hidden />
          )}
        </div>
      </div>

      {/* Bottom tab nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-[var(--border)] bg-[var(--bg)]/95 px-2 backdrop-blur md:hidden">
        {tabs.slice(0, 2).map((tab) => (
          <BottomTabItem key={tab.label} tab={tab} active={tab.match(path)} />
        ))}
        {/* Center FAB */}
        <Link
          to="/create"
          prefetch="intent"
          className="grid h-12 w-12 -translate-y-3 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-glow"
          aria-label="Create"
        >
          <Plus className="h-[22px] w-[22px]" strokeWidth={2.4} />
        </Link>
        {tabs.slice(2).map((tab) => (
          <BottomTabItem key={tab.label} tab={tab} active={tab.match(path)} />
        ))}
      </div>

      {/* Slide-up menu sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border-t border-border-strong bg-surface-1 p-5 animate-ps-sheet-up"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            {user && (
              <Link
                to="/checkout"
                prefetch="intent"
                onClick={() => setMenuOpen(false)}
                className="mb-4 flex items-center gap-3 rounded-md border border-border-accent bg-accent-soft-2 p-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-sm bg-accent-soft text-[var(--accent-text)]">
                  <Coins className="h-[18px] w-[18px]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <div className="mono text-[15px] font-semibold text-fg">
                    {user.credits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-fg-subtle">credits</div>
                </div>
                <span className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accent-fg)]">
                  Buy
                </span>
              </Link>
            )}

            <div className="u-label mb-2">Secondary</div>
            <div className="grid gap-1">
              <MenuRow
                onClick={() => setMenuOpen(false)}
                href="/users"
                icon={<Users className="h-[18px] w-[18px]" />}
                label="Users"
              />
              <MenuRow
                onClick={() => setMenuOpen(false)}
                href="/create-video"
                icon={<Video className="h-[18px] w-[18px]" />}
                label="Create Video"
              />
              <MenuRow
                onClick={() => setMenuOpen(false)}
                href="/sets"
                icon={<Layers className="h-[18px] w-[18px]" />}
                label="Sets"
              />
              <MenuRow
                onClick={() => setMenuOpen(false)}
                href="/whats-new"
                icon={<Sparkles className="h-[18px] w-[18px]" />}
                label="What's New"
              />
              {isAdmin && (
                <MenuRow
                  onClick={() => setMenuOpen(false)}
                  href="/admin"
                  icon={<Shield className="h-[18px] w-[18px]" />}
                  label="Admin"
                  trailing={<Badge tone="accent">Admin</Badge>}
                />
              )}
            </div>

            <div className="u-label mb-2 mt-5">Appearance</div>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-full items-center justify-between gap-3 rounded-sm bg-surface-2 px-3 py-2.5 text-fg hover:bg-surface-hover"
            >
              <span className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-[18px] w-[18px]" />
                ) : (
                  <Sun className="h-[18px] w-[18px]" />
                )}
                <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
              </span>
              <span className="text-[12px] text-fg-subtle">Tap to toggle</span>
            </button>

            {user && (
              <div className="mt-5 flex items-center gap-3 rounded-md border border-[var(--border)] bg-surface-2 px-3 py-2.5">
                <Avatar
                  name={user.name || user.username || "U"}
                  src={user.image}
                  size={36}
                />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold">
                    {user.name || user.username || "You"}
                  </div>
                  <div className="truncate text-[11.5px] text-fg-subtle">
                    @{user.username || "you"}
                  </div>
                </div>
                {isAdmin && <Badge tone="accent">Admin</Badge>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BottomTabItem({
  tab,
  active,
}: {
  tab: BottomTab;
  active: boolean;
}) {
  return (
    <Link
      to={tab.href}
      prefetch="intent"
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
        active ? "text-[var(--accent-text)]" : "text-fg-subtle",
      )}
    >
      {tab.icon}
      <span>{tab.label}</span>
    </Link>
  );
}

function MenuRow({
  href,
  icon,
  label,
  trailing,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      to={href}
      prefetch="intent"
      onClick={onClick}
      className="flex items-center gap-3 rounded-sm bg-surface-2 px-3 py-2.5 text-fg hover:bg-surface-hover"
    >
      <span className="text-fg-muted">{icon}</span>
      <span className="flex-1 text-[14px] font-medium">{label}</span>
      {trailing}
    </Link>
  );
}
