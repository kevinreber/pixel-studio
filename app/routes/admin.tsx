import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { PageContainer } from "~/components";
import { cn } from "@/lib/utils";
import { Shield, Trash2, LayoutDashboard, Users, Coins, BarChart3, Heart } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden - Admin access required", { status: 403 });
  }

  return json({ user: userWithRoles });
}

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Credits",
    href: "/admin/credits",
    icon: Coins,
  },
  {
    label: "Models",
    href: "/admin/models",
    icon: BarChart3,
  },
  {
    label: "Engagement",
    href: "/admin/engagement",
    icon: Heart,
  },
  {
    label: "Deletion Logs",
    href: "/admin/deletion-logs",
    icon: Trash2,
  },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-6 md:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor platform content
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <nav className="flex gap-4">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </PageContainer>
  );
}
