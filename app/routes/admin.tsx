import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { PageContainer } from "~/components";
import { cn } from "@/lib/utils";
import {
  Shield,
  Trash2,
  LayoutDashboard,
  Users,
  Coins,
  BarChart3,
  Heart,
  UserCog,
  Wallet,
  Activity,
} from "lucide-react";
import { PageHeader, Badge } from "~/components/ps";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden - Admin access required", { status: 403 });
  }

  return json({ user: userWithRoles });
}

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Credits", href: "/admin/credits", icon: Coins },
  { label: "Tokens", href: "/admin/tokens", icon: UserCog },
  { label: "Models", href: "/admin/models", icon: BarChart3 },
  { label: "Engagement", href: "/admin/engagement", icon: Heart },
  { label: "External Services", href: "/admin/external-services", icon: Wallet },
  { label: "Deletion Logs", href: "/admin/deletion-logs", icon: Trash2 },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl py-6 md:py-10">
        <PageHeader
          icon={<Shield className="h-[20px] w-[20px]" strokeWidth={2} />}
          title="Admin dashboard"
          subtitle="Manage and monitor platform content"
          actions={
            <Badge
              tone="success"
              icon={<Activity className="h-3 w-3" strokeWidth={2.4} />}
            >
              Live
            </Badge>
          }
        />

        {/* Tab strip */}
        <div className="mb-8 -mx-1 overflow-x-auto border-b border-[var(--border)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex min-w-max gap-1 px-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  // Prefetch on hover/focus. Safe now that the DB has a
                  // 5-connection pool and every sub-tab loader is wrapped in
                  // getCachedDataWithRevalidate (60s TTL) — the first hover
                  // populates the cache, subsequent visits return in ~50ms.
                  prefetch="intent"
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3.5 py-3 text-[13.5px] font-semibold transition-colors",
                    isActive
                      ? "border-[var(--accent)] text-[var(--accent-text)]"
                      : "border-transparent text-fg-subtle hover:text-fg",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Outlet />
      </div>
    </PageContainer>
  );
}
