import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { getImageDeletionStats } from "~/services/imageDeletionLog.server";
import { prisma } from "~/services/prisma.server";
import {
  getAdminDashboardStats,
  getCreditFlowSummary,
  getGenerationStats,
} from "~/services/adminAnalytics.server";
import { getCachedDataWithRevalidate } from "~/utils/cache.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trash2,
  Users,
  Image,
  ChevronRight,
  Shield,
  Coins,
  Zap,
  TrendingUp,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminStatCard } from "~/components/ps";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  // Wrap each independent query so a single Prisma pool timeout doesn't
  // tank the whole dashboard. Same pattern as admin.credits.tsx.
  const failed: string[] = [];
  const safe = <T,>(label: string, p: Promise<T>, fallback: T): Promise<T> =>
    p.catch((err) => {
      failed.push(label);
      console.warn(
        `[admin._index] ${label} failed:`,
        err instanceof Error ? err.message : err,
      );
      return fallback;
    });

  const emptyDashboardStats = {
    totalUsers: 0,
    activeUsersToday: 0,
    totalImages: 0,
    totalGenerations: 0,
    creditsInCirculation: 0,
    zeroCreditUsers: 0,
  } as Awaited<ReturnType<typeof getAdminDashboardStats>>;
  const emptyFlow = {
    totalPurchased: 0,
    totalSpent: 0,
    totalRefunded: 0,
    totalBonuses: 0,
    netFlow: 0,
    transactionCount: 0,
  } as Awaited<ReturnType<typeof getCreditFlowSummary>>;
  const emptyGenStats = {
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
  } as Awaited<ReturnType<typeof getGenerationStats>>;

  type AdminUserRow = {
    id: string;
    username: string;
    email: string;
    image: string | null;
    createdAt: Date;
    roles: { name: string }[];
  };
  const emptyDeletionStats = {
    totalDeletions: 0,
    deletionsByAdmin: [] as Awaited<
      ReturnType<typeof getImageDeletionStats>
    >["deletionsByAdmin"],
  } as Awaited<ReturnType<typeof getImageDeletionStats>>;

  // Cache each aggregate for 60s so admin nav within a session is instant.
  // Dev DB has connection_limit=1 which means all of these run serially —
  // the first cold visit pays the full cost; refreshes within 60s are free.
  const TTL = 60;
  const [
    deletionStats,
    dashboardStats,
    creditFlowToday,
    generationStatsToday,
    adminUsers,
  ] = await Promise.all([
    safe(
      "deletionStats",
      getCachedDataWithRevalidate(
        "admin:deletion-stats",
        () => getImageDeletionStats(),
        TTL,
      ),
      emptyDeletionStats,
    ),
    safe(
      "dashboardStats",
      getCachedDataWithRevalidate(
        "admin:dashboard-stats",
        () => getAdminDashboardStats(),
        TTL,
      ),
      emptyDashboardStats,
    ),
    safe(
      "creditFlowToday",
      getCachedDataWithRevalidate(
        "admin:credit-flow:today",
        () => getCreditFlowSummary("today"),
        TTL,
      ),
      emptyFlow,
    ),
    safe(
      "generationStatsToday",
      getCachedDataWithRevalidate(
        "admin:generation-stats:today",
        () => getGenerationStats("today"),
        TTL,
      ),
      emptyGenStats,
    ),
    safe(
      "adminUsers",
      getCachedDataWithRevalidate(
        "admin:admin-users",
        () =>
          prisma.user.findMany({
            where: {
              roles: {
                some: { name: { equals: "admin", mode: "insensitive" } },
              },
            },
            select: {
              id: true,
              username: true,
              email: true,
              image: true,
              createdAt: true,
              roles: { select: { name: true } },
            },
            orderBy: { createdAt: "asc" },
          }) as Promise<AdminUserRow[]>,
        TTL,
      ),
      [] as AdminUserRow[],
    ),
  ]);

  return json({
    deletionStats,
    dashboardStats,
    creditFlowToday,
    generationStatsToday,
    adminUsers,
    dataFailures: failed,
  });
}

export default function AdminDashboard() {
  const {
    deletionStats,
    dashboardStats,
    creditFlowToday,
    generationStatsToday,
    adminUsers,
    dataFailures,
  } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-8">
      {dataFailures && dataFailures.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft p-3 text-[13px] text-warning">
          <span className="mono mt-px text-[11px]">⚠</span>
          <div>
            <div className="font-semibold">
              Some metrics couldn&apos;t be loaded
            </div>
            <div className="text-[12px] text-warning/80">
              {dataFailures.length} of 5 queries timed out
              {dataFailures.length === 5
                ? ". Check the DB connection pool."
                : ` (${dataFailures.join(", ")}). Refresh to retry.`}
            </div>
          </div>
        </div>
      )}

      {/* Platform Stats Overview — redesigned stat cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <AdminStatCard
          label="Total Users"
          value={dashboardStats.totalUsers}
          sub="Registered accounts"
          icon={<Users className="h-4 w-4" />}
          tone="info"
        />
        <AdminStatCard
          label="Active Today"
          value={dashboardStats.activeUsersToday}
          sub="Users generating"
          icon={<Activity className="h-4 w-4" />}
          tone="success"
        />
        <AdminStatCard
          label="Total Images"
          value={dashboardStats.totalImages}
          sub="Generated content"
          icon={<Image className="h-4 w-4" />}
          tone="accent"
        />
        <AdminStatCard
          label="Generations"
          value={dashboardStats.totalGenerations}
          sub="All time"
          icon={<Zap className="h-4 w-4" />}
          tone="warning"
        />
        <AdminStatCard
          label="Credits Active"
          value={dashboardStats.creditsInCirculation}
          sub="In circulation"
          icon={<Coins className="h-4 w-4" />}
          tone="warning"
        />
        <Card className="border-warning/30 bg-warning-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="u-label">Zero Credits</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="mono text-3xl font-bold text-warning">
              {dashboardStats.zeroCreditUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Users at risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Credits Purchased"
          value={`+${creditFlowToday.totalPurchased.toLocaleString()}`}
          sub="today"
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
        />
        <AdminStatCard
          label="Credits Spent"
          value={`-${creditFlowToday.totalSpent.toLocaleString()}`}
          sub="today"
          icon={<Coins className="h-4 w-4" />}
          tone="danger"
        />
        <AdminStatCard
          label="Generations"
          value={generationStatsToday.total.toLocaleString()}
          sub="today"
          icon={<Zap className="h-4 w-4" />}
          tone="info"
        />
        <AdminStatCard
          label="Success Rate"
          value={`${generationStatsToday.successRate}%`}
          sub="today"
          icon={<Activity className="h-4 w-4" />}
          tone={
            generationStatsToday.successRate >= 90
              ? "success"
              : generationStatsToday.successRate >= 70
                ? "warning"
                : "danger"
          }
        />
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/users" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">User Analytics</CardTitle>
                <CardDescription>
                  View signups, activity, and credit distribution
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/credits" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Coins className="w-5 h-5 text-amber-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">Credit Economy</CardTitle>
                <CardDescription>
                  Monitor credit flow and generation metrics
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/deletion-logs" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">Deletion Logs</CardTitle>
                <CardDescription>
                  View history of deleted images and videos
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/explore" className="group">
            <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Image className="w-5 h-5 text-purple-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">Browse Content</CardTitle>
                <CardDescription>
                  Review and moderate user content
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Deletion Stats by Admin */}
      {deletionStats.deletionsByAdmin.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Deletions by Admin</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {deletionStats.deletionsByAdmin.map((stat) => (
                  <div
                    key={stat.deletedBy}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground font-mono">
                      {stat.deletedBy}
                    </span>
                    <span className="font-medium">
                      {stat._count.id} deletion{stat._count.id !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Users */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Admin Users</h2>
          <Badge variant="secondary" className="ml-2">
            {adminUsers.length}
          </Badge>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {adminUsers.map((admin) => (
                <Link
                  key={admin.id}
                  to={`/profile/${admin.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={admin.image ?? undefined} alt={admin.username} />
                    <AvatarFallback>
                      {admin.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{admin.username}</span>
                      <Badge variant="destructive" className="text-xs">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {admin.email}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden sm:block">
                    <span className="text-xs uppercase tracking-wide block mb-0.5">
                      Member since
                    </span>
                    {new Date(admin.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
