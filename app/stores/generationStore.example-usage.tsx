/**
 * Example: Simplified Processing Page using Zustand
 *
 * This shows how the processing.$requestId.tsx page would look
 * when using the Zustand store instead of local state + manual polling.
 *
 * Key improvements:
 * - No useRef for intervals/WebSocket
 * - No useEffect for polling setup
 * - No manual cleanup logic
 * - State survives component remounts
 * - Easy to add persistence (refresh survives)
 */

import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { useEffect } from "react";
import { PageContainer } from "~/components";
import { getProcessingStatus } from "~/services/processingStatus.server";
import {
  useGenerationStore,
  selectJobById,
  type GenerationJob,
} from "~/stores/generationStore";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  RefreshCw,
  GitCompare,
} from "lucide-react";
import { MODEL_OPTIONS } from "~/config/models";

export const meta: MetaFunction = () => {
  return [{ title: "Generating Images - Pixel Studio" }];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const requestId = params.requestId;
  const url = new URL(request.url);
  const isComparisonMode = url.searchParams.get("comparison") === "true";

  if (!requestId) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const initialStatus = await getProcessingStatus(requestId);

  return json({
    requestId,
    initialStatus,
    isComparisonMode,
  });
};

const getModelName = (modelValue: string): string => {
  const model = MODEL_OPTIONS.find((m) => m.value === modelValue);
  return model?.name || modelValue;
};

/**
 * BEFORE: ~240 lines of component code with manual state management
 * AFTER: ~150 lines with Zustand handling polling automatically
 */
export default function ProcessingPage() {
  const { requestId, initialStatus, isComparisonMode } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // =========================================================================
  // Zustand integration - this replaces ALL the manual state management
  // =========================================================================
  const job = useGenerationStore(selectJobById(requestId));
  const connectionStatus = useGenerationStore((s) => s.connectionStatus);
  const addJob = useGenerationStore((s) => s.addJob);

  // Initialize job tracking if not already tracked
  useEffect(() => {
    if (!job) {
      addJob({
        requestId,
        type: "image",
        status: initialStatus?.status ?? "queued",
        progress: initialStatus?.progress ?? 0,
        message: initialStatus?.message,
        setId: initialStatus?.setId,
        comparisonMode: isComparisonMode,
      });
    }
  }, [requestId, job, addJob, initialStatus, isComparisonMode]);

  // Handle redirect when complete
  useEffect(() => {
    if (!job) return;

    if (job.status === "complete" || job.status === "partial") {
      const timer = setTimeout(() => {
        if (job.comparisonMode || isComparisonMode) {
          navigate(`/compare/${requestId}`);
        } else if (job.setId) {
          navigate(`/sets/${job.setId}`);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [job, requestId, navigate, isComparisonMode]);

  // =========================================================================
  // That's it! No more:
  // - const wsRef = useRef<WebSocket | null>(null);
  // - const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // - const hasRedirectedRef = useRef(false);
  // - Complex useEffect for polling setup
  // - Complex useEffect for WebSocket setup
  // - Manual cleanup in useEffect returns
  // =========================================================================

  const isComparison = isComparisonMode || job?.comparisonMode;
  const displayState = getStatusDisplay(job, isComparison);

  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-2xl m-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Image Generation</h1>

        {/* Status Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <StatusHeader job={job} isComparison={isComparison} displayState={displayState} />
          <ProgressBar displayState={displayState} isComparison={isComparison} />

          {/* Per-Model Progress (Comparison Mode) */}
          {isComparison && job?.modelStatuses && (
            <ModelProgressList modelStatuses={job.modelStatuses} />
          )}

          {/* Connection Status */}
          <ConnectionIndicator status={connectionStatus} />
        </div>

        {/* Actions */}
        <ActionButtons
          job={job}
          requestId={requestId}
          isComparison={isComparison}
        />

        {/* Navigation */}
        <NavigationFooter />
      </div>
    </PageContainer>
  );
}

// ============================================================================
// Helper components (same as before, just extracted)
// ============================================================================

interface DisplayState {
  title: string;
  message: string;
  progress: number;
  isError: boolean;
}

function getStatusDisplay(
  job: GenerationJob | undefined,
  isComparison: boolean | undefined
): DisplayState {
  if (!job) {
    return {
      title: isComparison
        ? "Preparing comparison generation..."
        : "Preparing to generate images...",
      message: "Please wait while we set up your image generation.",
      progress: 0,
      isError: false,
    };
  }

  const modelCount = job.totalModels || job.models?.length || 0;
  const completedCount = job.completedModels || 0;

  switch (job.status) {
    case "queued":
      return {
        title: isComparison
          ? `Comparison with ${modelCount} models queued`
          : "Your images are queued for generation",
        message: job.message || "Waiting in the generation queue...",
        progress: 5,
        isError: false,
      };

    case "processing":
      return {
        title: isComparison
          ? `Generating with ${modelCount} models...`
          : "Generating your images...",
        message:
          job.message ||
          (isComparison
            ? `${completedCount}/${modelCount} models complete`
            : "Creating amazing images with AI..."),
        progress: Math.max(job.progress, 10),
        isError: false,
      };

    case "complete":
      return {
        title: isComparison
          ? "🎉 Comparison complete!"
          : "🎉 Images generated successfully!",
        message: job.message || "Generation complete",
        progress: 100,
        isError: false,
      };

    case "partial":
      return {
        title: "⚠️ Comparison partially complete",
        message: job.message || "Some models completed successfully, others failed",
        progress: 100,
        isError: false,
      };

    case "failed":
      return {
        title: isComparison
          ? "❌ Comparison generation failed"
          : "❌ Image generation failed",
        message: job.error || job.message || "An error occurred during generation",
        progress: 0,
        isError: true,
      };

    default:
      return {
        title: "Processing...",
        message: "Please wait...",
        progress: 0,
        isError: false,
      };
  }
}

function StatusHeader({
  job,
  isComparison,
  displayState,
}: {
  job: GenerationJob | undefined;
  isComparison: boolean | undefined;
  displayState: DisplayState;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <StatusIcon job={job} isComparison={isComparison} />
      <div className="flex-1">
        <h2
          className={`text-xl font-semibold ${
            displayState.isError
              ? "text-red-400"
              : job?.status === "complete" || job?.status === "partial"
              ? "text-green-400"
              : "text-zinc-100"
          }`}
        >
          {displayState.title}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">{displayState.message}</p>
      </div>
    </div>
  );
}

function StatusIcon({
  job,
  isComparison,
}: {
  job: GenerationJob | undefined;
  isComparison: boolean | undefined;
}) {
  const bgColor =
    job?.status === "complete" || job?.status === "partial"
      ? "bg-green-500/20"
      : job?.status === "failed"
      ? "bg-red-500/20"
      : isComparison
      ? "bg-purple-500/20"
      : "bg-blue-500/20";

  return (
    <div className={`flex items-center justify-center w-16 h-16 rounded-full ${bgColor}`}>
      {job?.status === "complete" || job?.status === "partial" ? (
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      ) : job?.status === "failed" ? (
        <XCircle className="w-8 h-8 text-red-500" />
      ) : isComparison ? (
        <GitCompare className="w-8 h-8 text-purple-500 animate-pulse" />
      ) : (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      )}
    </div>
  );
}

function ProgressBar({
  displayState,
  isComparison,
}: {
  displayState: DisplayState;
  isComparison: boolean | undefined;
}) {
  const barColor = displayState.isError
    ? "bg-red-500"
    : displayState.progress === 100
    ? "bg-green-500"
    : isComparison
    ? "bg-purple-500"
    : "bg-blue-500";

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-zinc-400 mb-2">
        <span>Overall Progress</span>
        <span className="font-mono">{displayState.progress}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(displayState.progress, 5)}%` }}
        />
      </div>
    </div>
  );
}

function ModelProgressList({
  modelStatuses,
}: {
  modelStatuses: Record<string, { status: string; progress: number }>;
}) {
  return (
    <div className="mt-6 pt-4 border-t border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">Model Progress</h3>
      <div className="space-y-3">
        {Object.entries(modelStatuses).map(([modelValue, modelStatus]) => (
          <ModelProgressItem
            key={modelValue}
            modelValue={modelValue}
            modelStatus={modelStatus}
          />
        ))}
      </div>
    </div>
  );
}

function ModelProgressItem({
  modelValue,
  modelStatus,
}: {
  modelValue: string;
  modelStatus: { status: string; progress: number };
}) {
  const isComplete = modelStatus.status === "complete";
  const isFailed = modelStatus.status === "failed";
  const isProcessing = modelStatus.status === "processing";

  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 flex items-center justify-center">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : isFailed ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : isProcessing ? (
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        ) : (
          <Clock className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <span className="w-32 text-sm text-zinc-300 truncate">
        {getModelName(modelValue)}
      </span>
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isComplete ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-purple-500"
          }`}
          style={{ width: `${modelStatus.progress}%` }}
        />
      </div>
      <span className="w-10 text-xs text-zinc-500 text-right font-mono">
        {modelStatus.progress}%
      </span>
    </div>
  );
}

function ConnectionIndicator({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      {status === "connected" ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : status === "connecting" ? (
        <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
      ) : status === "error" ? (
        <WifiOff className="w-4 h-4 text-red-500" />
      ) : (
        <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />
      )}
      <span>
        {status === "connected" && "Connected to real-time updates"}
        {status === "connecting" && "Connecting..."}
        {status === "disconnected" && "Polling for updates..."}
        {status === "error" && "Connection error"}
      </span>
    </div>
  );
}

function ActionButtons({
  job,
  requestId,
  isComparison,
}: {
  job: GenerationJob | undefined;
  requestId: string;
  isComparison: boolean | undefined;
}) {
  if (job?.status === "complete" || job?.status === "partial") {
    if (isComparison) {
      return (
        <Link
          to={`/compare/${requestId}`}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          View Comparison Results
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }

    if (job.setId) {
      return (
        <Link
          to={`/sets/${job.setId}`}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          View Your Images
          <ArrowRight className="w-4 h-4" />
        </Link>
      );
    }
  }

  if (job?.status === "failed") {
    return (
      <Link
        to="/create"
        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
      <Clock className="w-3 h-3" />
      <span className="font-mono">Request: {requestId}</span>
    </div>
  );
}

function NavigationFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-zinc-800">
      <div className="flex items-center justify-between text-sm">
        <Link
          to="/create"
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ← Back to Create
        </Link>
        <Link
          to="/sets"
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          View All Sets →
        </Link>
      </div>
    </div>
  );
}
