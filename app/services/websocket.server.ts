import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { parse } from "url";
import {
  getProcessingStatus,
  getProcessingStatusService,
} from "./processingStatus.server";
import type { ProcessingStatusData } from "./processingStatus.server";

// WebSocket server configuration
const WS_PORT = parseInt(process.env.WS_PORT || "3001");

/**
 * WebSocket server for real-time processing status updates
 * Clients connect to /processing/:requestId/status for real-time updates
 */
export class ProcessingWebSocketServer {
  private wss: WebSocketServer;
  private httpServer: ReturnType<typeof createServer>;
  private clients: Map<string, Set<WebSocket>> = new Map();
  private isRunning: boolean = false;
  private statusPollingInterval: NodeJS.Timeout | null = null;
  private redirectsSent: Set<string> = new Set(); // Track which requests have been sent redirects

  constructor(port: number = WS_PORT) {
    // Create HTTP server for WebSocket upgrade and health check
    this.httpServer = createServer((req, res) => {
      // Add health check endpoint for monitoring
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "healthy",
            isRunning: this.isRunning,
            totalClients: Array.from(this.clients.values()).reduce(
              (total, clientSet) => total + clientSet.size,
              0
            ),
            activeRequests: this.clients.size,
          })
        );
        return;
      }

      // Return 404 for other HTTP requests
      res.writeHead(404);
      res.end("Not Found");
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: "/ws",
    });

    // Set the port
    this.httpServer.listen(port, () => {
      console.log(`🔌 WebSocket server listening on port ${port}`);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("WebSocket server is already running");
      return;
    }

    console.log("🚀 Starting WebSocket server for processing updates...");

    try {
      // Note: Using polling approach with Upstash Redis instead of pub/sub
      // Start polling for status updates every second
      this.startStatusPolling();
      console.log("📡 Started status polling for processing updates");

      // Handle WebSocket connections
      this.wss.on("connection", (ws, request) => {
        this.handleConnection(ws, request);
      });

      // Handle server errors
      this.wss.on("error", (error) => {
        console.error("WebSocket server error:", error);
      });

      this.isRunning = true;
      console.log("✅ WebSocket server started successfully");
    } catch (error) {
      console.error("Failed to start WebSocket server:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("⏹️  Stopping WebSocket server...");

    this.isRunning = false;

    try {
      // Close all client connections
      this.clients.forEach((clientSet) => {
        clientSet.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "Server shutting down");
          }
        });
      });
      this.clients.clear();
      this.redirectsSent.clear(); // Clear redirect tracking

      // Stop status polling
      if (this.statusPollingInterval) {
        clearInterval(this.statusPollingInterval);
        this.statusPollingInterval = null;
      }

      // Close WebSocket server
      this.wss.close();
      this.httpServer.close();

      console.log("✅ WebSocket server stopped successfully");
    } catch (error) {
      console.error("Error stopping WebSocket server:", error);
    }
  }

  private startStatusPolling(): void {
    // Poll for status updates every 2 seconds
    this.statusPollingInterval = setInterval(async () => {
      if (!this.isRunning) {
        return;
      }

      // Always get active request IDs from Redis to clean up completed ones
      const service = getProcessingStatusService();
      const activeRequests = await service.getActiveProcessingRequests();
      const requestIds = activeRequests.map((req) => req.requestId);

      // Also include any WebSocket client request IDs
      const clientRequestIds = Array.from(this.clients.keys());
      const allRequestIds = [...new Set([...requestIds, ...clientRequestIds])];

      if (allRequestIds.length === 0) {
        console.log("📭 No requests to poll");
        return;
      }

      for (const requestId of allRequestIds) {
        try {
          const currentStatus = await getProcessingStatus(requestId);
          if (currentStatus) {
            // Check if request has active clients before broadcasting
            const clients = this.clients.get(requestId);
            if (clients && clients.size > 0) {
              this.broadcastToClients(requestId, currentStatus);
            }

            // Clean up completed or failed requests - be more aggressive about cleanup
            if (
              currentStatus.status === "complete" ||
              currentStatus.status === "failed"
            ) {
              // If no clients connected, cleanup immediately
              if (!clients || clients.size === 0) {
                console.log(
                  `🧹 Auto-cleanup: No clients for ${currentStatus.status} request ${requestId}`
                );
                this.cleanupRequest(requestId).catch((error) =>
                  console.error(
                    `Failed to cleanup completed request ${requestId}:`,
                    error
                  )
                );
              } else {
                // If clients are still connected, send final update but prepare for cleanup
                console.log(
                  `📤 Final update sent to ${clients.size} clients for ${currentStatus.status} request ${requestId}`
                );

                // For completed requests, if redirect was already sent, cleanup more aggressively
                if (
                  currentStatus.status === "complete" &&
                  this.redirectsSent.has(requestId)
                ) {
                  console.log(
                    `⚡ Fast cleanup: Redirect already sent for ${requestId}`
                  );
                  setTimeout(() => {
                    this.cleanupRequest(requestId).catch((error) =>
                      console.error(
                        `Failed fast cleanup for ${requestId}:`,
                        error
                      )
                    );
                  }, 5000); // 5 second cleanup after redirect sent
                } else {
                  // Schedule cleanup in 30 seconds if clients don't disconnect
                  setTimeout(() => {
                    const stillActiveClients = this.clients.get(requestId);
                    if (stillActiveClients && stillActiveClients.size === 0) {
                      console.log(
                        `⏰ Scheduled cleanup for abandoned request: ${requestId}`
                      );
                      this.cleanupRequest(requestId).catch((error) =>
                        console.error(
                          `Failed scheduled cleanup for ${requestId}:`,
                          error
                        )
                      );
                    }
                  }, 30000);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error polling status for ${requestId}:`, error);
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  private async cleanupRequest(requestId: string): Promise<void> {
    const clients = this.clients.get(requestId);
    console.log(
      `🧹 Attempting cleanup for request: ${requestId}, clients: ${
        clients?.size || 0
      }`
    );

    // Always try to clean up if no clients or clients set is empty
    if (!clients || clients.size === 0) {
      console.log(`🧹 Cleaning up inactive request: ${requestId}`);
      this.clients.delete(requestId);
      this.redirectsSent.delete(requestId); // Also cleanup redirect tracking

      // Also delete from Redis to stop future polling
      try {
        const service = getProcessingStatusService();
        // Get current status first to check if it should be cleaned up
        const currentStatus = await service.getProcessingStatus(requestId);
        if (
          currentStatus &&
          (currentStatus.status === "complete" ||
            currentStatus.status === "failed")
        ) {
          await service.deleteProcessingStatus(requestId);
          console.log(
            `🗑️ Deleted completed/failed processing status from Redis: ${requestId} (${currentStatus.status})`
          );
        } else if (currentStatus) {
          console.log(
            `⏭️ Keeping active request in Redis: ${requestId} (${currentStatus.status})`
          );
        }
      } catch (error) {
        console.error(
          `Failed to delete processing status for ${requestId}:`,
          error
        );
      }
    }
  }

  private handleConnection(ws: WebSocket, request: { url?: string }): void {
    const requestId = this.extractRequestId(request.url);

    if (!requestId) {
      console.warn("WebSocket connection attempted without valid request ID");
      ws.close(1008, "Invalid request ID");
      return;
    }

    console.log(`🔗 WebSocket client connected for request: ${requestId}`);

    // Add client to request-specific group
    if (!this.clients.has(requestId)) {
      this.clients.set(requestId, new Set());
    }
    this.clients.get(requestId)!.add(ws);

    // Send current status immediately
    this.sendCurrentStatus(ws, requestId);

    // Handle messages from client (optional - for ping/pong, etc.)
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, requestId, message);
      } catch (error) {
        console.warn("Invalid message from client:", error);
      }
    });

    // Handle client disconnect
    ws.on("close", (code, reason) => {
      console.log(
        `🔌 WebSocket client disconnected for request: ${requestId} (${code}: ${reason})`
      );

      const clientSet = this.clients.get(requestId);
      if (clientSet) {
        clientSet.delete(ws);

        // Remove empty sets and cleanup immediately
        if (clientSet.size === 0) {
          this.clients.delete(requestId);
          // Cleanup immediately instead of waiting 5 seconds
          this.cleanupRequest(requestId).catch((error) =>
            console.error(`Failed to cleanup request ${requestId}:`, error)
          );
        }
      }
    });

    // Handle connection errors
    ws.on("error", (error) => {
      console.error(`WebSocket error for request ${requestId}:`, error);
    });

    // Set up ping/pong for connection health
    ws.ping();
    ws.on("pong", () => {
      // Connection is alive
    });
  }

  private handleClientMessage(
    ws: WebSocket,
    requestId: string,
    message: { type: string }
  ): void {
    // Handle client messages (e.g., ping, status request, etc.)
    switch (message.type) {
      case "ping":
        this.sendMessage(ws, {
          type: "pong",
          timestamp: new Date().toISOString(),
        });
        break;

      case "get_status":
        this.sendCurrentStatus(ws, requestId);
        break;

      default:
        console.warn(`Unknown message type from client: ${message.type}`);
    }
  }

  private async sendCurrentStatus(
    ws: WebSocket,
    requestId: string
  ): Promise<void> {
    try {
      const currentStatus = await getProcessingStatus(requestId);

      if (currentStatus) {
        this.sendMessage(ws, {
          type: "status_update",
          data: currentStatus,
        });
      } else {
        this.sendMessage(ws, {
          type: "status_not_found",
          requestId,
          message: "Processing status not found",
        });
      }
    } catch (error) {
      console.error(`Failed to send current status for ${requestId}:`, error);
      this.sendMessage(ws, {
        type: "error",
        message: "Failed to retrieve status",
      });
    }
  }

  private broadcastToClients(
    requestId: string,
    update: ProcessingStatusData
  ): void {
    const clientSet = this.clients.get(requestId);

    if (!clientSet || clientSet.size === 0) {
      return; // No clients connected for this request
    }

    console.log(
      `📤 Broadcasting update to ${clientSet.size} clients for request: ${requestId}`
    );

    // Ensure we have valid data before broadcasting
    if (!update || typeof update !== "object") {
      console.warn(`Invalid status update for ${requestId}:`, update);
      return;
    }

    const message = {
      type: "status_update",
      data: update,
    };

    // Broadcast to all connected clients for this request
    clientSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      } else {
        // Remove dead connections
        clientSet.delete(ws);
      }
    });

    // Clean up empty client sets
    if (clientSet.size === 0) {
      this.clients.delete(requestId);
    }

    // Handle completion - send redirect ONLY ONCE and cleanup
    if (
      update.status === "complete" &&
      update.setId &&
      !this.redirectsSent.has(requestId)
    ) {
      console.log(
        `📤 Sending one-time redirect for completed request: ${requestId}`
      );

      // Mark this request as having received a redirect
      this.redirectsSent.add(requestId);

      setTimeout(() => {
        clientSet.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            this.sendMessage(ws, {
              type: "redirect",
              url: `/sets/${update.setId}`,
            });
          }
        });

        // Schedule cleanup after redirect is sent
        setTimeout(() => {
          console.log(`🧹 Auto-cleanup after redirect sent for: ${requestId}`);
          this.cleanupRequest(requestId).catch((error) =>
            console.error(
              `Failed to cleanup after redirect ${requestId}:`,
              error
            )
          );
        }, 1000); // Give clients time to navigate
      }, 2000); // 2 second delay to show completion message
    }
  }

  private sendMessage(ws: WebSocket, message: Record<string, unknown>): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        const messageString = JSON.stringify(message);
        ws.send(messageString);
      } else {
        console.warn(
          `Attempted to send message to WebSocket in state: ${ws.readyState}`
        );
      }
    } catch (error) {
      console.error(
        "Failed to send WebSocket message:",
        error,
        "Message:",
        message
      );
    }
  }

  private extractRequestId(url: string | undefined): string | null {
    if (!url) return null;

    try {
      const parsed = parse(url, true);

      // Support multiple URL patterns:
      // /ws?requestId=123
      // /ws/processing/123
      const requestId =
        (parsed.query.requestId as string) ||
        parsed.pathname?.match(/\/processing\/([^/]+)/)?.[1];

      return requestId || null;
    } catch (error) {
      console.error("Failed to extract request ID from URL:", error);
      return null;
    }
  }

  // Health check methods
  isHealthy(): boolean {
    // WebSocketServer doesn't have readyState - use isRunning instead
    return this.isRunning;
  }

  getConnectionStats(): Record<string, unknown> {
    const stats = {
      isRunning: this.isRunning,
      totalClients: Array.from(this.clients.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      activeRequests: this.clients.size,
      requests: Array.from(this.clients.entries()).map(
        ([requestId, clients]) => ({
          requestId,
          clientCount: clients.size,
        })
      ),
    };

    return stats;
  }
}

// Singleton instance
let wsServerInstance: ProcessingWebSocketServer | null = null;

/**
 * Get singleton WebSocket server instance
 */
export function getWebSocketServer(): ProcessingWebSocketServer {
  if (!wsServerInstance) {
    wsServerInstance = new ProcessingWebSocketServer();
  }
  return wsServerInstance;
}

/**
 * Start the WebSocket server
 */
export async function startWebSocketServer(): Promise<ProcessingWebSocketServer> {
  const server = getWebSocketServer();
  await server.start();
  return server;
}

/**
 * Stop the WebSocket server
 */
export async function stopWebSocketServer(): Promise<void> {
  if (wsServerInstance) {
    await wsServerInstance.stop();
    wsServerInstance = null;
  }
}

// Note: Using polling approach with Upstash Redis - no persistent connections needed

// Graceful shutdown
process.on("SIGTERM", async () => {
  await stopWebSocketServer();
});

process.on("SIGINT", async () => {
  await stopWebSocketServer();
});
