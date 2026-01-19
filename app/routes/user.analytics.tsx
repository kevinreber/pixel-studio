/**
 * User Analytics Dashboard Page
 *
 * Displays comprehensive analytics and insights for the user
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserInsightsDashboard, type UserInsightsDashboard } from "~/services/analyticsInsights.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  CreditCard,
  Heart,
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  Target,
  Palette,
} from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Analytics Dashboard | Pixel Studio" },
    { name: "description", content: "View your generation statistics and insights" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const dashboard = await getUserInsightsDashboard(user.id);

  return json({ dashboard });
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trend.value >= 0 ? "text-green-500" : "text-red-500"}`}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModelUsageChart({ modelUsage }: { modelUsage: UserInsightsDashboard["modelUsage"] }) {
  const total = modelUsage.reduce((sum, m) => sum + m.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Usage
        </CardTitle>
        <CardDescription>Which AI models you use most</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modelUsage.slice(0, 5).map((model) => (
          <div key={model.model} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{model.model.replace(/-/g, " ")}</span>
              <span className="text-muted-foreground">
                {model.count} ({total > 0 ? Math.round((model.count / total) * 100) : 0}%)
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${total > 0 ? (model.count / total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Success: {Math.round(model.successRate)}%</span>
              <span>Avg: {Math.round(model.averageTime)}s</span>
            </div>
          </div>
        ))}
        {modelUsage.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">
            No generation data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StyleUsageChart({ styleUsage }: { styleUsage: UserInsightsDashboard["styleUsage"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Style Performance
        </CardTitle>
        <CardDescription>How different styles perform for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {styleUsage.slice(0, 5).map((style) => (
          <div key={style.style} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {style.style}
              </Badge>
              <span className="text-sm text-muted-foreground">{style.count} images</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="text-sm">{style.averageLikes.toFixed(1)} avg</span>
            </div>
          </div>
        ))}
        {styleUsage.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">No style data yet</p>
        )}
      </CardContent>
    </Card>
  );
}

function StyleFingerprint({
  fingerprint,
}: {
  fingerprint: UserInsightsDashboard["styleFingerprint"];
}) {
  if (!fingerprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Your Style Fingerprint
          </CardTitle>
          <CardDescription>Generate more images to discover your unique style</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Not enough data to compute your style fingerprint yet.
            <br />
            Keep creating to unlock this feature!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Your Style Fingerprint
        </CardTitle>
        <CardDescription>Your unique creative identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(fingerprint.diversityScore * 100)}%</div>
            <div className="text-xs text-muted-foreground">Diversity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(fingerprint.consistencyScore * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(fingerprint.experimentalScore * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Experimental</div>
          </div>
        </div>

        {/* Dominant Styles */}
        {fingerprint.dominantStyles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Dominant Styles</h4>
            <div className="flex flex-wrap gap-2">
              {fingerprint.dominantStyles.map((style) => (
                <Badge key={style} variant="outline" className="capitalize">
                  {style}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dominant Colors */}
        {fingerprint.dominantColors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Color Palette</h4>
            <div className="flex flex-wrap gap-2">
              {fingerprint.dominantColors.map((color) => (
                <Badge key={color} variant="secondary" className="capitalize">
                  {color}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Common Keywords */}
        {fingerprint.commonKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Common Themes</h4>
            <div className="flex flex-wrap gap-2">
              {fingerprint.commonKeywords.slice(0, 8).map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopPrompts({ prompts }: { prompts: Array<{
  promptPreview: string;
  usageCount: number;
  successRate: number;
  averageLikes: number;
  bestModel: string | null;
  bestStyle: string | null;
  lastUsedAt: Date | string;
}> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Top Performing Prompts
        </CardTitle>
        <CardDescription>Your most successful prompts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prompts.map((prompt, index) => (
            <div key={index} className="border-b pb-3 last:border-0">
              <p className="text-sm font-medium line-clamp-2">{prompt.promptPreview}...</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Used {prompt.usageCount}x</span>
                <span>{Math.round(prompt.successRate)}% success</span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {prompt.averageLikes.toFixed(1)} avg
                </span>
                {prompt.bestModel && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {prompt.bestModel}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {prompts.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              No prompt data yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreditUsage({ creditUsage }: { creditUsage: {
  totalSpent: number;
  totalPurchased: number;
  totalEarned: number;
  currentBalance: number;
  spendingByCategory: Record<string, number>;
  recentTransactions: Array<{
    type: string;
    amount: number;
    description: string;
    createdAt: Date | string;
  }>;
} }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Usage
        </CardTitle>
        <CardDescription>Your credit spending and earnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold">{creditUsage.currentBalance}</div>
            <div className="text-xs text-muted-foreground">Current Balance</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-red-500">-{creditUsage.totalSpent}</div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-green-500">+{creditUsage.totalPurchased}</div>
            <div className="text-xs text-muted-foreground">Purchased</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-blue-500">+{creditUsage.totalEarned}</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {creditUsage.recentTransactions.slice(0, 5).map((tx, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate flex-1">
                  {tx.description || tx.type}
                </span>
                <span className={tx.amount >= 0 ? "text-green-500" : "text-red-500"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
            {creditUsage.recentTransactions.length === 0 && (
              <p className="text-muted-foreground text-xs text-center py-2">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { dashboard } = useLoaderData<typeof loader>();

  const generationTrend =
    dashboard.trends.generationsLastWeek > 0
      ? Math.round(
          ((dashboard.trends.generationsThisWeek - dashboard.trends.generationsLastWeek) /
            dashboard.trends.generationsLastWeek) *
            100
        )
      : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your creative journey and discover insights about your style
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="style">Style Analysis</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Generations"
              value={dashboard.generationStats.totalGenerations}
              description={`${dashboard.generationStats.successfulGenerations} successful`}
              icon={ImageIcon}
              trend={{ value: generationTrend, label: "vs last week" }}
            />
            <StatCard
              title="Success Rate"
              value={`${Math.round(dashboard.generationStats.successRate)}%`}
              description="of generations completed"
              icon={Zap}
            />
            <StatCard
              title="Avg Generation Time"
              value={`${Math.round(dashboard.generationStats.averageGenerationTime)}s`}
              icon={BarChart3}
            />
            <StatCard
              title="New Followers"
              value={dashboard.trends.newFollowersThisWeek}
              description="this week"
              icon={Heart}
            />
          </div>

          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-2">
            <ModelUsageChart modelUsage={dashboard.modelUsage} />
            <StyleFingerprint fingerprint={dashboard.styleFingerprint} />
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ModelUsageChart modelUsage={dashboard.modelUsage} />
            <StyleUsageChart styleUsage={dashboard.styleUsage} />
          </div>
          <TopPrompts prompts={dashboard.topPrompts} />
        </TabsContent>

        <TabsContent value="style" className="space-y-6">
          <StyleFingerprint fingerprint={dashboard.styleFingerprint} />
          <div className="grid gap-6 md:grid-cols-2">
            <StyleUsageChart styleUsage={dashboard.styleUsage} />
            <TopPrompts prompts={dashboard.topPrompts} />
          </div>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <CreditUsage creditUsage={dashboard.creditUsage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
