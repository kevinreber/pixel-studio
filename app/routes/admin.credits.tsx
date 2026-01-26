import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import {
  getCreditFlowSummary,
  getCreditTrends,
  getRecentCreditTransactions,
  getGenerationStats,
  getModelUsageBreakdown,
  getGenerationTrends,
  getModelSuccessRates,
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
  Coins,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") as Period) || "month";

  const [
    creditFlowToday,
    creditFlowWeek,
    creditFlowMonth,
    creditFlowAll,
    creditTrends,
    recentTransactions,
    generationStats,
    modelUsage,
    generationTrends,
    modelSuccessRates,
  ] = await Promise.all([
    getCreditFlowSummary("today"),
    getCreditFlowSummary("week"),
    getCreditFlowSummary("month"),
    getCreditFlowSummary("all"),
    getCreditTrends(14),
    getRecentCreditTransactions(20),
    getGenerationStats(period),
    getModelUsageBreakdown(period),
    getGenerationTrends(14),
    getModelSuccessRates(period),
  ]);

  return json({
    creditFlow: {
      today: creditFlowToday,
      week: creditFlowWeek,
      month: creditFlowMonth,
      all: creditFlowAll,
    },
    creditTrends,
    recentTransactions,
    generationStats,
    modelUsage,
    generationTrends,
    modelSuccessRates,
    currentPeriod: period,
  });
}

function PeriodSelector({ currentPeriod }: { currentPeriod: Period }) {
  const periods: { value: Period; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      {periods.map((p) => (
        <Link
          key={p.value}
          to={`?period=${p.value}`}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            currentPeriod === p.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}

function formatTransactionType(type: string) {
  const types: Record<string, { label: string; color: string; icon: typeof Coins }> = {
    purchase: { label: "Purchase", color: "text-green-500", icon: ArrowUpRight },
    spend: { label: "Spent", color: "text-red-500", icon: ArrowDownRight },
    refund: { label: "Refund", color: "text-blue-500", icon: RefreshCw },
    bonus: { label: "Bonus", color: "text-purple-500", icon: Gift },
    admin_adjustment: { label: "Admin", color: "text-orange-500", icon: Zap },
  };
  return types[type] || { label: type, color: "text-muted-foreground", icon: Coins };
}

export default function AdminCreditsPage() {
  const {
    creditFlow,
    creditTrends,
    recentTransactions,
    generationStats,
    modelUsage,
    generationTrends,
    modelSuccessRates,
    currentPeriod,
  } = useLoaderData<typeof loader>();

  const maxCreditTrend = Math.max(
    ...creditTrends.map((d) => Math.max(d.purchased, d.spent)),
    1
  );
  const maxGenerationTrend = Math.max(...generationTrends.map((d) => d.total), 1);

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Credit Economy & Generations</h2>
          <p className="text-sm text-muted-foreground">
            Monitor credit flow and generation metrics
          </p>
        </div>
        <PeriodSelector currentPeriod={currentPeriod} />
      </div>

      {/* Credit Flow Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Purchased</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{creditFlow.month.totalPurchased.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Today:</span>
              <span className="text-xs font-medium">
                +{creditFlow.today.totalPurchased.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{creditFlow.month.totalSpent.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Today:</span>
              <span className="text-xs font-medium">
                -{creditFlow.today.totalSpent.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Refunded</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {creditFlow.month.totalRefunded.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Today:</span>
              <span className="text-xs font-medium">
                {creditFlow.today.totalRefunded.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Credit Flow</CardTitle>
            <Coins className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                creditFlow.month.netFlow >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {creditFlow.month.netFlow >= 0 ? "+" : ""}
              {creditFlow.month.netFlow.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {creditFlow.month.transactionCount.toLocaleString()} transactions this
              month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generation Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generationStats.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPeriod === "all" ? "All time" : `This ${currentPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {generationStats.successful.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Completed generations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {generationStats.failed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Failed generations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                generationStats.successRate >= 90
                  ? "text-green-600"
                  : generationStats.successRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
              )}
            >
              {generationStats.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: 95%+
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credit Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Credit Flow (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily credit purchases vs spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {creditTrends.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={`${day.date}: +${day.purchased} purchased, -${day.spent} spent`}
                >
                  <div className="w-full flex flex-col gap-0.5" style={{ height: "100%" }}>
                    <div
                      className="w-full bg-green-500/80 rounded-t transition-all hover:bg-green-500"
                      style={{
                        height: `${(day.purchased / maxCreditTrend) * 50}%`,
                        minHeight: day.purchased > 0 ? "4px" : "0px",
                      }}
                    />
                    <div
                      className="w-full bg-red-500/80 rounded-b transition-all hover:bg-red-500"
                      style={{
                        height: `${(day.spent / maxCreditTrend) * 50}%`,
                        minHeight: day.spent > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Purchased</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Spent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generation Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Generation Volume (Last 14 Days)
            </CardTitle>
            <CardDescription>Daily generation attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {generationTrends.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center"
                  title={`${day.date}: ${day.successful} successful, ${day.failed} failed`}
                >
                  <div
                    className="w-full flex flex-col justify-end"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="w-full bg-red-500/80 rounded-t"
                      style={{
                        height: `${(day.failed / maxGenerationTrend) * 100}%`,
                        minHeight: day.failed > 0 ? "4px" : "0px",
                      }}
                    />
                    <div
                      className="w-full bg-green-500/80 rounded-b transition-all hover:bg-green-500"
                      style={{
                        height: `${(day.successful / maxGenerationTrend) * 100}%`,
                        minHeight: day.successful > 0 ? "4px" : "0px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Successful</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage and Success Rates */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Model Usage
            </CardTitle>
            <CardDescription>Generation distribution by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            {modelUsage.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No generation data available
              </div>
            ) : (
              <div className="space-y-4">
                {modelUsage.map((model) => (
                  <div key={model.model} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{model.model}</span>
                      <span className="text-muted-foreground">
                        {model.count.toLocaleString()} ({model.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Success Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Model Success Rates
            </CardTitle>
            <CardDescription>Success rate by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            {modelSuccessRates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No generation data available
              </div>
            ) : (
              <div className="space-y-4">
                {modelSuccessRates.map((model) => (
                  <div
                    key={model.model}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <span className="font-medium text-sm">{model.model}</span>
                      <p className="text-xs text-muted-foreground">
                        {model.successful} successful / {model.total} total
                      </p>
                    </div>
                    <Badge
                      variant={
                        model.successRate >= 90
                          ? "default"
                          : model.successRate >= 70
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-sm"
                    >
                      {model.successRate}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest credit activity across the platform</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentTransactions.map((tx) => {
                const typeInfo = formatTransactionType(tx.type);
                const Icon = typeInfo.icon;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-muted",
                        typeInfo.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={tx.user.image ?? undefined}
                        alt={tx.user.username}
                      />
                      <AvatarFallback>
                        {tx.user.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {tx.user.username}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          tx.amount >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
