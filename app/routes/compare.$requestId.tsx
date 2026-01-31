import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { PageContainer } from "~/components";
import { getProcessingStatus } from "~/services/processingStatus.server";
import { prisma } from "~/services/prisma.server";
import { MODEL_OPTIONS } from "~/config/models";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink,
  GitCompare,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const meta: MetaFunction = () => {
  return [{ title: "Comparison Results - Pixel Studio" }];
};

interface ModelResult {
  model: string;
  modelName: string;
  status: "complete" | "failed" | "processing" | "queued";
  setId?: string;
  images: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
  error?: string;
}

interface LoaderData {
  requestId: string;
  prompt: string;
  results: ModelResult[];
  overallStatus: string;
  totalModels: number;
  completedModels: number;
}

// Helper to get model display name
const getModelInfo = (modelValue: string) => {
  const model = MODEL_OPTIONS.find((m) => m.value === modelValue);
  return {
    name: model?.name || modelValue,
    company: model?.company || "Unknown",
    creditCost: model?.creditCost || 1,
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const requestId = params.requestId;

  if (!requestId) {
    throw new Response("Request ID is required", { status: 400 });
  }

  // Get comparison status from Redis
  const status = await getProcessingStatus(requestId);

  if (!status) {
    throw new Response("Comparison not found or expired", { status: 404 });
  }

  // Cast to comparison status type
  const comparisonStatus = status as unknown as {
    status: string;
    models?: string[];
    modelStatuses?: Record<
      string,
      { status: string; progress: number; setId?: string; error?: string }
    >;
    totalModels?: number;
    completedModels?: number;
    message?: string;
  };

  // Get the prompt from the first model's set or from status message
  let prompt = "Comparison";
  const results: ModelResult[] = [];

  if (comparisonStatus.modelStatuses) {
    for (const [modelValue, modelStatus] of Object.entries(
      comparisonStatus.modelStatuses
    )) {
      const modelInfo = getModelInfo(modelValue);
      const result: ModelResult = {
        model: modelValue,
        modelName: modelInfo.name,
        status: modelStatus.status as ModelResult["status"],
        setId: modelStatus.setId,
        images: [],
        error: modelStatus.error,
      };

      // If this model completed, fetch its images
      if (modelStatus.setId) {
        const set = await prisma.set.findUnique({
          where: { id: modelStatus.setId },
          include: {
            images: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        if (set) {
          prompt = set.prompt;
          result.images = set.images.map((img) => ({
            id: img.id,
            url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${img.id}.png`,
            title: img.title || undefined,
          }));
        }
      }

      results.push(result);
    }
  }

  return json<LoaderData>({
    requestId,
    prompt,
    results,
    overallStatus: comparisonStatus.status,
    totalModels: comparisonStatus.totalModels || results.length,
    completedModels: comparisonStatus.completedModels || 0,
  });
};

export default function CompareResultsPage() {
  const { prompt, results, totalModels } = useLoaderData<LoaderData>();

  const successCount = results.filter((r) => r.status === "complete").length;
  const failedCount = results.filter((r) => r.status === "failed").length;

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Create
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20">
              <GitCompare className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">Comparison Results</h1>
          </div>

          <p className="text-zinc-400 max-w-2xl mb-4">
            Prompt: <span className="text-zinc-200">&ldquo;{prompt}&rdquo;</span>
          </p>

          {/* Status summary */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-400">
              {successCount} of {totalModels} models completed
            </span>
            {failedCount > 0 && (
              <span className="text-red-400">
                ({failedCount} failed)
              </span>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((result) => (
            <Card
              key={result.model}
              className={`border transition-all ${
                result.status === "complete"
                  ? "border-green-500/30 bg-green-500/5"
                  : result.status === "failed"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-zinc-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">
                    {result.modelName}
                  </CardTitle>
                  {result.status === "complete" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : result.status === "failed" ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {result.status === "complete" && result.images.length > 0 ? (
                  <div className="space-y-3">
                    {/* Image gallery */}
                    <div className="grid grid-cols-2 gap-2">
                      {result.images.slice(0, 4).map((image, idx) => (
                        <div
                          key={image.id}
                          className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
                        >
                          <img
                            src={image.url}
                            alt={image.title || `Generated image ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    {result.images.length > 4 && (
                      <p className="text-xs text-zinc-500 text-center">
                        +{result.images.length - 4} more images
                      </p>
                    )}
                    {/* View set link */}
                    {result.setId && (
                      <Link
                        to={`/sets/${result.setId}`}
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                      >
                        View Full Set
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ) : result.status === "failed" ? (
                  <div className="py-8 text-center">
                    <XCircle className="w-12 h-12 text-red-500/50 mx-auto mb-3" />
                    <p className="text-sm text-red-400">Generation failed</p>
                    {result.error && (
                      <p className="text-xs text-zinc-500 mt-2">{result.error}</p>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <RefreshCw className="w-12 h-12 text-zinc-600 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-zinc-500">
                      {result.status === "processing" ? "Generating..." : "Queued"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <Link
              to="/create"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← Create New Images
            </Link>
            <Link
              to="/sets"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View All Sets →
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
