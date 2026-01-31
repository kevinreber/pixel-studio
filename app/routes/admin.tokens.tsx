import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { getAllTokenBalances, type TokenBalance } from "~/services/externalTokens.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Wallet,
  Cpu,
  Video,
  CreditCard,
  Database,
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden - Admin access required", { status: 403 });
  }

  const tokenBalances = await getAllTokenBalances();

  return json({
    tokenBalances,
    fetchedAt: new Date().toISOString(),
  });
}

function getStatusIcon(status: TokenBalance["status"]) {
  switch (status) {
    case "available":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "low":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "depleted":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "unknown":
      return <HelpCircle className="h-5 w-5 text-zinc-400" />;
  }
}

function getStatusBadge(status: TokenBalance["status"]) {
  switch (status) {
    case "available":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>;
    case "low":
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Low Balance</Badge>;
    case "depleted":
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Depleted</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "unknown":
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

function getServiceIcon(service: string) {
  // Image generation services
  if (["openai", "huggingface", "replicate", "fal", "together", "blackforest"].includes(service)) {
    return <Cpu className="h-5 w-5" />;
  }
  // Video generation services
  if (["runway", "luma", "stability"].includes(service)) {
    return <Video className="h-5 w-5" />;
  }
  // Payment services
  if (service === "stripe") {
    return <CreditCard className="h-5 w-5" />;
  }
  // Database/cache services
  if (service === "upstash") {
    return <Database className="h-5 w-5" />;
  }
  return <Wallet className="h-5 w-5" />;
}

function getServiceColor(service: string): string {
  const colors: Record<string, string> = {
    openai: "text-green-500",
    huggingface: "text-yellow-500",
    replicate: "text-blue-500",
    fal: "text-purple-500",
    together: "text-indigo-500",
    blackforest: "text-emerald-500",
    stability: "text-violet-500",
    runway: "text-pink-500",
    luma: "text-cyan-500",
    stripe: "text-blue-600",
    upstash: "text-teal-500",
  };
  return colors[service] || "text-zinc-500";
}

function formatBalance(balance: number | undefined, unit: string): string {
  if (balance === undefined) return "—";
  if (unit === "USD") {
    return `$${balance.toFixed(2)}`;
  }
  return `${balance.toLocaleString()} ${unit}`;
}

// Group services by category
function groupServices(balances: TokenBalance[]) {
  const imageGen = balances.filter((b) =>
    ["openai", "huggingface", "replicate", "fal", "together", "blackforest"].includes(b.service)
  );
  const videoGen = balances.filter((b) =>
    ["runway", "luma", "stability"].includes(b.service)
  );
  const infrastructure = balances.filter((b) =>
    ["stripe", "upstash"].includes(b.service)
  );

  return { imageGen, videoGen, infrastructure };
}

export default function AdminTokens() {
  const { tokenBalances, fetchedAt } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    revalidator.revalidate();
    // Small delay to show the spinning animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const { imageGen, videoGen, infrastructure } = groupServices(tokenBalances);

  // Count services by status
  const statusCounts = tokenBalances.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">External Services</h2>
          <p className="text-muted-foreground">
            Monitor token balances and API status across all integrated services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date(fetchedAt).toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || revalidator.state === "loading"}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                (isRefreshing || revalidator.state === "loading") && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenBalances.length}</div>
            <p className="text-xs text-muted-foreground">Integrated APIs</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.available || 0}
            </div>
            <p className="text-xs text-muted-foreground">Services healthy</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.low || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(statusCounts.depleted || 0) + (statusCounts.error || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Require action</p>
          </CardContent>
        </Card>
      </div>

      {/* Image Generation Services */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Image Generation</h3>
          <Badge variant="secondary">{imageGen.length}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {imageGen.map((service) => (
            <ServiceCard key={service.service} service={service} />
          ))}
        </div>
      </div>

      {/* Video Generation Services */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">Video Generation</h3>
          <Badge variant="secondary">{videoGen.length}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videoGen.map((service) => (
            <ServiceCard key={service.service} service={service} />
          ))}
        </div>
      </div>

      {/* Infrastructure Services */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-teal-500" />
          <h3 className="text-lg font-semibold">Infrastructure</h3>
          <Badge variant="secondary">{infrastructure.length}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {infrastructure.map((service) => (
            <ServiceCard key={service.service} service={service} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: TokenBalance }) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800",
                getServiceColor(service.service)
              )}
            >
              {getServiceIcon(service.service)}
            </div>
            <div>
              <CardTitle className="text-base">{service.displayName}</CardTitle>
              <CardDescription className="text-xs">
                {service.unit}
              </CardDescription>
            </div>
          </div>
          {getStatusIcon(service.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Balance display */}
          {service.balance !== undefined ? (
            <div>
              <div className="text-2xl font-bold">
                {formatBalance(service.balance, service.unit)}
              </div>
              {service.used !== undefined && service.limit !== undefined && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Used: {formatBalance(service.used, service.unit)}</span>
                    <span>Limit: {formatBalance(service.limit, service.unit)}</span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        service.status === "available" && "bg-green-500",
                        service.status === "low" && "bg-yellow-500",
                        service.status === "depleted" && "bg-red-500"
                      )}
                      style={{
                        width: `${Math.min(100, (service.used / service.limit) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {service.error || "Balance not available via API"}
            </div>
          )}

          {/* Status badge and dashboard link */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {getStatusBadge(service.status)}
            {service.dashboardUrl && (
              <a
                href={service.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
