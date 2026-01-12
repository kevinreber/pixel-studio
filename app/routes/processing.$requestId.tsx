import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { PageContainer } from "~/components";
import { getProcessingStatus } from "~/services/processingStatus.server";
import type { ProcessingStatusData } from "~/services/processingStatus.server";
import { Loader2, CheckCircle2, XCircle, Clock, Wifi, WifiOff, ArrowRight, RefreshCw } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Generating Images - Pixel Studio" }];
};

interface LoaderData {
  requestId: string;
  initialStatus: ProcessingStatusData | null;
  wsUrl: string;
  isKafkaEnabled: boolean;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const requestId = params.requestId;

  if (!requestId) {
    throw new Response("Request ID is required", { status: 400 });
  }

  // Get initial status from Redis
  const initialStatus = await getProcessingStatus(requestId);

  // If status not found, it might be a new request or expired
  if (!initialStatus) {
    console.warn(`Processing status not found for request: ${requestId}`);
  }

  // Check if async queue is enabled (QStash or Kafka)
  const isQueueEnabled =
    !!process.env.QSTASH_TOKEN ||
    process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true" ||
    process.env.ENABLE_ASYNC_QUEUE === "true";

  // Construct WebSocket URL based on environment
  // In production: use WS_URL env var (e.g., wss://ws.yourdomain.com)
  // In development: use localhost with WS_PORT
  const wsUrl = process.env.WS_URL || `ws://localhost:${process.env.WS_PORT || "3001"}`;

  return json<LoaderData>({
    requestId,
    initialStatus,
    wsUrl,
    isKafkaEnabled: isQueueEnabled,
  });
};

interface ProcessingStatus {
  requestId: string;
  userId: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number;
  message?: string;
  setId?: string;
  images?: unknown[];
  error?: string;
  timestamp: Date;
}

export default function ProcessingPage() {
  const { requestId, initialStatus, wsUrl, isKafkaEnabled } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProcessingStatus | null>(
    initialStatus
      ? {
          ...initialStatus,
          timestamp: new Date(initialStatus.timestamp),
        }
      : null
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirectedRef = useRef(false);

  // Polling function to fetch status via HTTP
  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/processing/${requestId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Processing request not found. It may have expired.");
          return;
        }
        throw new Error("Failed to fetch status");
      }

      const data = await response.json();
      setStatus(data);
      setConnectionStatus("connected");
      setError(null);

      // Handle completion - redirect to set page
      if (data.status === "complete" && data.setId && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        // Small delay to show completion state
        setTimeout(() => {
          navigate(`/sets/${data.setId}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Don't show error for transient polling failures
      setConnectionStatus("disconnected");
    }
  }, [requestId, navigate]);

  // Primary: Polling-based status updates (works everywhere)
  useEffect(() => {
    // Initial fetch
    pollStatus();

    // Poll every 2 seconds while processing
    pollingIntervalRef.current = setInterval(() => {
      // Stop polling if completed, failed, or already redirected
      if (
        hasRedirectedRef.current ||
        status?.status === "complete" ||
        status?.status === "failed"
      ) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        return;
      }
      pollStatus();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollStatus, status?.status]);

  // Optional: WebSocket enhancement for faster updates (local dev)
  useEffect(() => {
    // Only try WebSocket in development or if explicitly configured
    const shouldUseWebSocket =
      isKafkaEnabled && wsUrl && !wsUrl.includes("undefined");

    if (!shouldUseWebSocket) {
      return;
    }

    const connectWebSocket = () => {
      try {
        const fullWsUrl = `${wsUrl}/ws?requestId=${requestId}`;
        const ws = new WebSocket(fullWsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected (enhanced mode)");
          setConnectionStatus("connected");
          ws.send(JSON.stringify({ type: "get_status" }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "status_update" && message.data) {
              setStatus(message.data);
            }
            if (message.type === "redirect" && message.url && !hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              ws.close(1000, "Redirecting");
              navigate(message.url);
            }
          } catch (e) {
            console.warn("WebSocket parse error:", e);
          }
        };

        ws.onerror = () => {
          console.log("WebSocket error - falling back to polling");
          // Don't show error, polling will handle it
        };

        ws.onclose = () => {
          wsRef.current = null;
        };

        wsRef.current = ws;
      } catch (e) {
        console.log("WebSocket not available - using polling");
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [requestId, wsUrl, isKafkaEnabled, navigate]);

  // Determine display state
  const getStatusDisplay = () => {
    if (!status) {
      return {
        title: "Preparing to generate images...",
        message: "Please wait while we set up your image generation.",
        progress: 0,
        isError: false,
      };
    }

    switch (status.status) {
      case "queued":
        return {
          title: "Your images are queued for generation",
          message: status.message || "Waiting in the generation queue...",
          progress: 5,
          isError: false,
        };

      case "processing":
        return {
          title: "Generating your images...",
          message: status.message || "Creating amazing images with AI...",
          progress: Math.max(status.progress, 10),
          isError: false,
        };

      case "complete":
        return {
          title: "🎉 Images generated successfully!",
          message:
            status.message ||
            `Generated ${status.images?.length || 0} images successfully`,
          progress: 100,
          isError: false,
        };

      case "failed":
        return {
          title: "❌ Image generation failed",
          message:
            status.error ||
            status.message ||
            "An error occurred during generation",
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
  };

  const displayState = getStatusDisplay();

  return (
    <PageContainer>
      <div className="flex flex-col justify-between w-full max-w-2xl m-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Image Generation</h1>

        {/* Status Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-full ${
                status?.status === "complete"
                  ? "bg-green-500/20"
                  : status?.status === "failed"
                  ? "bg-red-500/20"
                  : "bg-blue-500/20"
              }`}
            >
              {status?.status === "complete" ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : status?.status === "failed" ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              )}
            </div>

            <div className="flex-1">
              <h2
                className={`text-xl font-semibold ${
                  displayState.isError
                    ? "text-red-400"
                    : status?.status === "complete"
                    ? "text-green-400"
                    : "text-zinc-100"
                }`}
              >
                {displayState.title}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {displayState.message}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Progress</span>
              <span className="font-mono">{displayState.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  displayState.isError
                    ? "bg-red-500"
                    : displayState.progress === 100
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.max(displayState.progress, 5)}%` }}
              ></div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {connectionStatus === "connected" ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : connectionStatus === "connecting" ? (
              <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : connectionStatus === "error" ? (
              <WifiOff className="w-4 h-4 text-red-500" />
            ) : (
              <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />
            )}
            <span>
              {connectionStatus === "connected" && "Connected to real-time updates"}
              {connectionStatus === "connecting" && "Connecting..."}
              {connectionStatus === "disconnected" && "Reconnecting..."}
              {connectionStatus === "error" && "Connection error"}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {status?.status === "complete" && status.setId && (
            <Link
              to={`/sets/${status.setId}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Your Images
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {status?.status === "failed" && (
            <Link
              to="/create"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Link>
          )}

          {/* Request Info */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
            <Clock className="w-3 h-3" />
            <span className="font-mono">Request: {requestId}</span>
          </div>
        </div>

        {/* Back to Create Link */}
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
      </div>
    </PageContainer>
  );
}
