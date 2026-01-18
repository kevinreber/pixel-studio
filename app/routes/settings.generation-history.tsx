import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services";
import { getUserGenerationHistory, getUserGenerationStats } from "~/services/generationLog.server";
import { PageContainer } from "~/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Image as ImageIcon, Video as VideoIcon, Clock, Coins, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const meta: MetaFunction = () => {
  return [{ title: "Generation History - Settings" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const [history, stats] = await Promise.all([
    getUserGenerationHistory(user.id, { limit: 50 }),
    getUserGenerationStats(user.id),
  ]);

  return json({ history, stats });
};

export default function GenerationHistoryPage() {
  const { history, stats } = useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back to Settings Link */}
        <div className="mb-6">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generation History</h1>
          <p className="text-gray-400">
            View your image and video generation attempts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalGenerations}</div>
                <div className="text-sm text-gray-400 mt-1">Total Generations</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {stats.successfulGenerations}
                </div>
                <div className="text-sm text-gray-400 mt-1">Successful</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {stats.failedGenerations}
                </div>
                <div className="text-sm text-gray-400 mt-1">Failed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl font-bold">{stats.totalCreditsSpent}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">Credits Spent</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation History List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Generations</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No generation history yet</p>
                <p className="text-sm mt-2">Start creating images or videos to see your history here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side - Type icon and details */}
                      <div className="flex gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {log.type === "image" ? (
                            <ImageIcon className="w-8 h-8 text-blue-400" />
                          ) : (
                            <VideoIcon className="w-8 h-8 text-purple-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={log.status === "complete" ? "default" : "destructive"}>
                              {log.status === "complete" ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {log.status}
                            </Badge>
                            <Badge variant="outline">{log.type}</Badge>
                            <Badge variant="outline">{log.model}</Badge>
                          </div>

                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                            {log.prompt}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" />
                              {log.creditCost} credits
                            </span>
                            {log.duration && (
                              <span>{log.duration}s</span>
                            )}
                          </div>

                          {log.errorMessage && (
                            <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                              Error: {log.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Preview and link */}
                      <div className="flex-shrink-0">
                        {log.status === "complete" && log.setId && (
                          <Link
                            to={`/sets/${log.setId}`}
                            className="text-sm text-blue-400 hover:text-blue-300 underline"
                          >
                            View Result
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
