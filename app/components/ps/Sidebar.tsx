import * as React from "react";
import { Link, useLocation } from "@remix-run/react";
import {
  Compass,
  Rss,
  Users,
  Wand2,
  Video,
  Layers,
  Heart,
  User,
  Sparkles,
  Shield,
  Plus,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import PixelStudioIcon from "components/PixelStudioIcon";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  match?: (path: string) => boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    credits: number;
  } | null;
  isAdmin: boolean;
  whatsNewCount?: number;
}

export function Sidebar({ user, isAdmin, whatsNewCount = 0 }: SidebarProps) {
  const loc = useLocation();
  const path = loc.pathname;

  const groups: NavGroup[] = [
    {
      label: "Discover",
      items: [
        {
          label: "Explore",
          href: "/explore",
          icon: <Compass className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/explore"),
        },
        {
          label: "Feed",
          href: "/feed",
          icon: <Rss className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/feed"),
        },
        {
          label: "Users",
          href: "/users",
          icon: <Users className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/users"),
        },
      ],
    },
    {
      label: "Create",
      items: [
        {
          label: "Image",
          href: "/create",
          icon: <Wand2 className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p === "/create" || p.startsWith("/processing"),
        },
        {
          label: "Video",
          href: "/create-video",
          icon: <Video className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/create-video"),
        },
        {
          label: "Sets",
          href: "/sets",
          icon: <Layers className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/sets"),
        },
      ],
    },
    {
      label: "Library",
      items: [
        {
          label: "Liked",
          href: "/likes",
          icon: <Heart className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/likes"),
        },
        {
          label: "Profile",
          href: user?.id ? `/profile/${user.id}` : "/login",
          icon: <User className="h-[18px] w-[18px]" strokeWidth={2} />,
          match: (p) => p.startsWith("/profile"),
        },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          label: "What's New",
          href: "/whats-new",
          icon: <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />,
          badge:
            whatsNewCount > 0 ? (
              <Badge tone="accent">{whatsNewCount}</Badge>
            ) : null,
          match: (p) => p.startsWith("/whats-new"),
        },
        ...(isAdmin
          ? [
              {
                label: "Admin",
                href: "/admin",
                icon: <Shield className="h-[18px] w-[18px]" strokeWidth={2} />,
                match: (p: string) => p.startsWith("/admin"),
                adminOnly: true,
              } satisfies NavItem,
            ]
          : []),
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[var(--border)] bg-surface-1 px-3 py-4 md:flex">
      {/* Logo */}
      <Link
        to="/"
        prefetch="intent"
        className="mb-4 flex items-center gap-2.5 px-2"
      >
        <div className="h-8 w-8">
          <PixelStudioIcon />
        </div>
        <span className="text-lg font-bold tracking-tight">Pixel Studio</span>
      </Link>

      {/* Primary CTA */}
      <Link to="/create" prefetch="intent" className="mb-4">
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="h-[16px] w-[16px]" strokeWidth={2.2} />}
          className="w-full"
        >
          New creation
        </Button>
      </Link>

      {/* Nav groups */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label} className="mt-2 first:mt-0">
            <div className="u-label px-3 pb-1.5 pt-2">{group.label}</div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.match
                  ? item.match(path)
                  : path === item.href;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    prefetch="intent"
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] font-medium transition-colors",
                      active
                        ? "bg-accent-soft text-[var(--accent-text)]"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--accent)]"
                      />
                    )}
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.badge}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Credits card */}
      {user && (
        <Link
          to="/checkout"
          prefetch="intent"
          className="mt-3 flex items-center gap-2 rounded-md border border-border-accent bg-accent-soft-2 p-3 transition-colors hover:bg-accent-soft"
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
          <span className="rounded-sm bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-[var(--accent-fg)]">
            Buy
          </span>
        </Link>
      )}

      {/* Account row */}
      {user && (
        <div className="mt-3 flex items-center gap-2 rounded-sm px-1 py-1.5">
          <Avatar
            name={user.name || user.username || "U"}
            src={user.image}
            size={32}
          />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-fg">
                {user.name || user.username || "You"}
              </span>
              {isAdmin && (
                <Badge tone="accent" className="px-1.5 py-0 text-[10px]">
                  <Shield className="h-2.5 w-2.5" strokeWidth={2.4} />
                  Admin
                </Badge>
              )}
            </div>
            <div className="truncate text-[11.5px] text-fg-subtle">
              @{user.username || "you"}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
