import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import {
  getModelRankings,
  getModelPopularityTrends,
  getModelUsageBreakdown,
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
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Users,
  Clock,
  BarChart3,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "week" | "month";

// Model display names and colors
const MODEL_CONFIG: Record<string, { name: string; color: string }> = {
  "dall-e-3": { name: "DALL-E 3", color: "bg-emerald-500" },
  "dall-e-2": { name: "DALL-E 2", color: "bg-emerald-400" },
  "stable-diffusion": { name: "Stable Diffusion", color: "bg-purple-500" },
  "stable-diffusion-xl": { name: "SD XL", color: "bg-purple-600" },
  "flux": { name: "Flux", color: "bg-blue-500" },
  "flux-pro": { name: "Flux Pro", color: "bg-blue-600" },
  "flux-schnell": { name: "Flux Schnell", color: "bg-blue-400" },
  "midjourney": { name: "Midjourney", color: "bg-orange-500" },
};

function getModelConfig(model: string) {
  return MODEL_CONFIG[model] || { name: model, color: "bg-zinc-500" };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const period = (url.searchParams.get("period") as Period) || "month";

  const [modelRankings, popularityTrends, modelUsage, modelSuccessRates] =
    await Promise.all([
      getModelRankings(period),
      getModelPopularityTrends(14),
      getModelUsageBreakdown(period === "week" ? "week" : "month"),
      getModelSuccessRates(period === "week" ? "week" : "month"),
    ]);

  // Process trends for chart - aggregate by model across days
  const trendsByModel: Record<string, number[]> = {};
  const dates: string[] = [];

  // Get unique dates
  const uniqueDates = [...new Set(popularityTrends.map((t) => t.date))].sort();
  dates.push(...uniqueDates.slice(-14)); // Last 14 days

  // Initialize model arrays
  modelUsage.forEach((m) => {
    trendsByModel[m.model] = new Array(dates.length).fill(0);
  });

  // Fill in the data
  popularityTrends.forEach((t) => {
    const dateIndex = dates.indexOf(t.date);
    if (dateIndex !== -1 && trendsByModel[t.model]) {
      trendsByModel[t.model][dateIndex] = t.count;
    }
  });

  return json({
    modelRankings,
    trendsByModel,
    dates,
    modelUsage,
    modelSuccessRates,
    currentPeriod: period,
  });
}

function PeriodSelector({ currentPeriod }: { currentPeriod: Period }) {
  const periods: { value: Period; label: string }[] = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
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

function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-500 text-xs font-medium">
        <ArrowUp className="h-3 w-3" />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="h-3 w-3" />
    </span>
  );
}

export default function AdminModelsPage() {
  const {
    modelRankings,
    trendsByModel,
    dates,
    modelUsage,
    modelSuccessRates,
    currentPeriod,
  } = useLoaderData<typeof loader>();

  // Calculate totals for summary cards
  const totalGenerations = modelRankings.reduce(
    (sum, m) => sum + m.currentCount,
    0
  );
  const totalUniqueUsers = modelRankings.reduce(
    (sum, m) => sum + m.uniqueUsers,
    0
  );
  const avgSuccessRate =
    modelSuccessRates.length > 0
      ? Math.round(
          modelSuccessRates.reduce((sum, m) => sum + m.successRate, 0) /
            modelSuccessRates.length
        )
      : 0;

  // Find max for chart scaling
  const allCounts = Object.values(trendsByModel).flat();
  const maxCount = Math.max(...allCounts, 1);

  // Get top 5 models for trend chart
  const topModels = modelUsage.slice(0, 5).map((m) => m.model);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Model Popularity</h2>
          <p className="text-sm text-muted-foreground">
            AI model usage trends and performance metrics
          </p>
        </div>
        <PeriodSelector currentPeriod={currentPeriod} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Generations
            </CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalGenerations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This {currentPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelRankings.length}</div>
            <p className="text-xs text-muted-foreground">Models in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUniqueUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Using AI models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Success Rate
            </CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                avgSuccessRate >= 90
                  ? "text-green-600"
                  : avgSuccessRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
              )}
            >
              {avgSuccessRate}%
            </div>
            <p className="text-xs text-muted-foreground">Across all models</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Model Rankings
          </CardTitle>
          <CardDescription>
            Ranked by usage with comparison to previous {currentPeriod}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modelRankings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No generation data available
            </div>
          ) : (
            <div className="space-y-3">
              {modelRankings.map((model) => {
                const config = getModelConfig(model.model);
                return (
                  <div
                    key={model.model}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-2 w-16">
                      <span
                        className={cn(
                          "text-2xl font-bold",
                          model.rank === 1
                            ? "text-yellow-500"
                            : model.rank === 2
                              ? "text-zinc-400"
                              : model.rank === 3
                                ? "text-amber-600"
                                : "text-muted-foreground"
                        )}
                      >
                        #{model.rank}
                      </span>
                      <RankChangeIndicator change={model.rankChange} />
                    </div>

                    {/* Model Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            config.color
                          )}
                        />
                        <span className="font-semibold">{config.name}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {model.uniqueUsers} users
                        </span>
                        {model.avgGenerationTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {model.avgGenerationTime}s avg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {model.currentCount.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs">
                        {model.change > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-0.5" />+
                            {model.change.toLocaleString()} (
                            {model.changePercent}%)
                          </span>
                        ) : model.change < 0 ? (
                          <span className="text-red-500 flex items-center">
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                            {model.change.toLocaleString()} (
                            {model.changePercent}%)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            No change
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Success Rate Badge */}
                    <div className="w-20 text-right">
                      {modelSuccessRates.find(
                        (m) => m.model === model.model
                      ) && (
                        <Badge
                          variant={
                            (modelSuccessRates.find(
                              (m) => m.model === model.model
                            )?.successRate ?? 0) >= 90
                              ? "default"
                              : (modelSuccessRates.find(
                                    (m) => m.model === model.model
                                  )?.successRate ?? 0) >= 70
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {modelSuccessRates.find(
                            (m) => m.model === model.model
                          )?.successRate ?? 0}
                          %
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Trends (Last 14 Days)
          </CardTitle>
          <CardDescription>
            Daily generation volume by top models
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dates.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No trend data available
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="flex items-end gap-1 h-48">
                {dates.map((date, dateIndex) => {
                  const dayTotal = topModels.reduce(
                    (sum, model) =>
                      sum + (trendsByModel[model]?.[dateIndex] || 0),
                    0
                  );
                  return (
                    <div
                      key={date}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                      title={`${date}: ${dayTotal} generations`}
                    >
                      <div className="w-full flex flex-col-reverse gap-0.5">
                        {topModels.map((model) => {
                          const count =
                            trendsByModel[model]?.[dateIndex] || 0;
                          const config = getModelConfig(model);
                          const height =
                            maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div
                              key={model}
                              className={cn(
                                "w-full rounded-sm transition-all hover:opacity-80",
                                config.color
                              )}
                              style={{
                                height: `${height}%`,
                                minHeight: count > 0 ? "2px" : "0px",
                              }}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
                {topModels.map((model) => {
                  const config = getModelConfig(model);
                  return (
                    <div key={model} className="flex items-center gap-2">
                      <div
                        className={cn("w-3 h-3 rounded", config.color)}
                      />
                      <span>{config.name}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Model Distribution & Success Rates */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Distribution
            </CardTitle>
            <CardDescription>Share of generations by model</CardDescription>
          </CardHeader>
          <CardContent>
            {modelUsage.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No data available
              </div>
            ) : (
              <div className="space-y-4">
                {modelUsage.map((model) => {
                  const config = getModelConfig(model.model);
                  return (
                    <div key={model.model} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              config.color
                            )}
                          />
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {model.count.toLocaleString()} ({model.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            config.color
                          )}
                          style={{ width: `${model.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rates by Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Success Rates
            </CardTitle>
            <CardDescription>Generation success rate by model</CardDescription>
          </CardHeader>
          <CardContent>
            {modelSuccessRates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No data available
              </div>
            ) : (
              <div className="space-y-3">
                {modelSuccessRates.map((model) => {
                  const config = getModelConfig(model.model);
                  return (
                    <div
                      key={model.model}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            config.color
                          )}
                        />
                        <div>
                          <span className="font-medium text-sm">
                            {config.name}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {model.successful.toLocaleString()} /{" "}
                            {model.total.toLocaleString()} generations
                          </p>
                        </div>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
