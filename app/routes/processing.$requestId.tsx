import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { PageContainer } from "~/components";
import { getProcessingStatus } from "~/services/processingStatus.server";
import type { ProcessingStatusData } from "~/services/processingStatus.server";

export const meta: MetaFunction = () => {
  return [{ title: "Generating Images - Pixel Studio" }];
};

interface LoaderData {
  requestId: string;
  initialStatus: ProcessingStatusData | null;
  wsPort: string;
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

  return json<LoaderData>({
    requestId,
    initialStatus,
    wsPort: process.env.WS_PORT || "3001",
    isKafkaEnabled: process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true",
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
  const { requestId, initialStatus, wsPort, isKafkaEnabled } =
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback(
    (message: {
      type: string;
      data?: ProcessingStatus;
      url?: string;
      message?: string;
    }) => {
      switch (message.type) {
        case "status_update":
          setStatus(message.data || null);
          break;

        case "redirect":
          // Server is telling us to redirect (processing complete)
          console.log(`Redirecting to: ${message.url}`);
          // Close WebSocket before navigating to prevent continued polling
          if (wsRef.current) {
            console.log("Closing WebSocket before redirect");
            wsRef.current.close(1000, "Processing complete, redirecting");
          }
          if (message.url) {
            navigate(message.url);
          }
          break;

        case "status_not_found":
          setError(
            "Processing request not found. It may have expired or completed."
          );
          break;

        case "error":
          setError(message.message || "An error occurred");
          break;

        case "pong":
          // Keep-alive response
          break;

        default:
          console.warn("Unknown WebSocket message type:", message.type);
      }
    },
    [navigate]
  );

  // WebSocket connection and management
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(`Connecting to WebSocket for request: ${requestId}`);
    }

    const connectWebSocket = () => {
      try {
        // Construct WebSocket URL
        const wsUrl = `ws://localhost:${wsPort}/ws?requestId=${requestId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
          setError(null);

          // Clear any reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          // Request current status
          ws.send(JSON.stringify({ type: "get_status" }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.warn(
              "Failed to parse WebSocket message:",
              error,
              "Raw data:",
              event.data
            );
            // Don't set error state for parsing errors as they might be non-critical
          }
        };

        ws.onerror = (error) => {
          console.warn("WebSocket connection error:", error);
          // Only set error state if this is a persistent connection failure
          // Don't immediately show error to user as it might be temporary
          if (connectionStatus === "connected") {
            console.log(
              "WebSocket error occurred but was previously connected, attempting to reconnect..."
            );
          } else {
            setConnectionStatus("error");
            setError("Connection to real-time updates failed");
          }
        };

        ws.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`);
          setConnectionStatus("disconnected");
          wsRef.current = null;

          // Attempt to reconnect unless it was a clean close
          if (event.code !== 1000 && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect WebSocket...");
              setConnectionStatus("connecting");
              connectWebSocket();
            }, 3000);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setConnectionStatus("error");
        setError("Failed to connect to real-time updates");
      }
    };

    // Only connect if Kafka is enabled
    if (isKafkaEnabled) {
      connectWebSocket();
    } else {
      // Fallback for when Kafka is disabled
      setError("Real-time updates are currently disabled");
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [requestId, wsPort, handleWebSocketMessage, isKafkaEnabled]);

  // Note: Redirect is now handled via WebSocket "redirect" message from server
  // This eliminates the race condition between multiple redirect mechanisms

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
      <div className="max-w-2xl mx-auto py-16">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              status?.status === "complete"
                ? "bg-green-100"
                : status?.status === "failed"
                ? "bg-red-100"
                : "bg-blue-100"
            }`}
          >
            {status?.status === "complete" ? (
              <div className="text-3xl">🎉</div>
            ) : status?.status === "failed" ? (
              <div className="text-3xl">❌</div>
            ) : (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
          </div>

          <h1
            className={`text-3xl font-bold mb-2 ${
              displayState.isError
                ? "text-red-700"
                : status?.status === "complete"
                ? "text-green-700"
                : "text-gray-900"
            }`}
          >
            {displayState.title}
          </h1>

          <p className="text-lg text-gray-700 font-medium">
            {displayState.message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-800 font-semibold mb-2">
            <span>Progress</span>
            <span>{displayState.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
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
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
              }`}
            ></div>
            <span className="text-gray-800 font-medium">
              {connectionStatus === "connected" &&
                "Connected to real-time updates"}
              {connectionStatus === "connecting" && "Connecting to updates..."}
              {connectionStatus === "disconnected" && "Reconnecting..."}
              {connectionStatus === "error" && "Connection error"}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-700">
          <p className="font-mono bg-gray-100 px-3 py-2 rounded-md inline-block">
            Request ID: {requestId}
          </p>
          {status?.status === "complete" && status.setId && (
            <p className="mt-2">
              <button
                onClick={() => navigate(`/sets/${status.setId}`)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View your images now →
              </button>
            </p>
          )}
          {status?.status === "failed" && (
            <p className="mt-4">
              <button
                onClick={() => navigate("/create")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Try again
              </button>
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
