import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import {
  getRecentSignups,
  getCreditDistribution,
  getZeroCreditUsers,
  getTopCreditHolders,
  getUserActivityBreakdown,
  getSignupTrends,
} from "~/services/adminAnalytics.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  TrendingUp,
  AlertCircle,
  Crown,
  Activity,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const [
    recentSignups,
    creditDistribution,
    zeroCreditUsers,
    topCreditHolders,
    activityBreakdown,
    signupTrends,
  ] = await Promise.all([
    getRecentSignups(10),
    getCreditDistribution(),
    getZeroCreditUsers(10),
    getTopCreditHolders(10),
    getUserActivityBreakdown(),
    getSignupTrends(14),
  ]);

  return json({
    recentSignups,
    creditDistribution,
    zeroCreditUsers,
    topCreditHolders,
    activityBreakdown,
    signupTrends,
  });
}

export default function AdminUsersPage() {
  const {
    recentSignups,
    creditDistribution,
    zeroCreditUsers,
    topCreditHolders,
    activityBreakdown,
    signupTrends,
  } = useLoaderData<typeof loader>();

  const totalDistributionUsers = creditDistribution.reduce((sum, b) => sum + b.count, 0);
  const maxSignupCount = Math.max(...signupTrends.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Activity Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityBreakdown.activeToday}</div>
            <p className="text-xs text-muted-foreground">Users who generated content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityBreakdown.activeThisWeek}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityBreakdown.activeThisMonth}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityBreakdown.inactive}</div>
            <p className="text-xs text-muted-foreground">No activity in 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Signup Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Signup Trends (Last 14 Days)
          </CardTitle>
          <CardDescription>Daily new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {signupTrends.map((day) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${day.date}: ${day.count} signups`}
              >
                <div
                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{
                    height: `${Math.max((day.count / maxSignupCount) * 100, 4)}%`,
                    minHeight: day.count > 0 ? "8px" : "4px",
                  }}
                />
                <span className="text-[10px] text-muted-foreground -rotate-45 origin-top-left translate-y-2 whitespace-nowrap">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-sm text-muted-foreground text-center">
            Total: {signupTrends.reduce((sum, d) => sum + d.count, 0)} new users
          </div>
        </CardContent>
      </Card>

      {/* Credit Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credit Distribution
          </CardTitle>
          <CardDescription>How credits are distributed across users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creditDistribution.map((bucket) => {
              const percentage =
                totalDistributionUsers > 0
                  ? (bucket.count / totalDistributionUsers) * 100
                  : 0;
              const isZero = bucket.bucket === "0 credits";

              return (
                <div key={bucket.bucket} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn("font-medium", isZero && "text-orange-500")}>
                      {bucket.bucket}
                    </span>
                    <span className="text-muted-foreground">
                      {bucket.count.toLocaleString()} users ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isZero ? "bg-orange-500" : "bg-primary"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for User Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              Recent Signups
            </CardTitle>
            <CardDescription>Newest users on the platform</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentSignups.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image ?? undefined} alt={user.username} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm">
                        {user.username}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {user.credits} credits
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user._count.generationLogs} generations · {user._count.images}{" "}
                      images
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Credit Holders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Top Credit Holders
            </CardTitle>
            <CardDescription>Users with the most credits</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {topCreditHolders.map((user, index) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="w-6 text-center">
                    {index < 3 ? (
                      <span
                        className={cn(
                          "text-lg font-bold",
                          index === 0 && "text-yellow-500",
                          index === 1 && "text-zinc-400",
                          index === 2 && "text-amber-600"
                        )}
                      >
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image ?? undefined} alt={user.username} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate text-sm block">
                      {user.username}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {user._count.images} images created
                    </p>
                  </div>
                  <Badge
                    variant={user.credits > 50 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.credits.toLocaleString()} credits
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zero Credit Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Zero Credit Users
            <Badge variant="outline" className="ml-2">
              {zeroCreditUsers.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Users who have run out of credits (potential churn risk)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {zeroCreditUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No users with zero credits
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {zeroCreditUsers.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image ?? undefined} alt={user.username} />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm">
                        {user.username}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        0 credits
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user._count.generationLogs} generations · {user._count.images}{" "}
                      images · Joined{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
