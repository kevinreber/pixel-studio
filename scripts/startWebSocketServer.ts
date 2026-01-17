#!/usr/bin/env tsx

import "dotenv/config";
import { startWebSocketServer } from "../app/services/websocket.server.js";

/**
 * Check if async queue processing is enabled (QStash or Kafka)
 */
function isAsyncQueueEnabled(): boolean {
  return (
    process.env.ENABLE_ASYNC_QUEUE === "true" ||
    !!process.env.QSTASH_TOKEN ||
    process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true"
  );
}

async function main() {
  console.log(
    "🚀 Starting WebSocket server for real-time processing updates..."
  );

  try {
    // Check if async queue feature is enabled (QStash or Kafka)
    if (!isAsyncQueueEnabled()) {
      console.log(
        "⏸️  Async queue is disabled. Set ENABLE_ASYNC_QUEUE=true or add QSTASH_TOKEN to enable."
      );
      console.log("   WebSocket server not needed for synchronous processing.");
      process.exit(0);
    }

    // Log which backend is being used
    const backend = process.env.QUEUE_BACKEND || "qstash";
    console.log(`📡 Queue backend: ${backend.toUpperCase()}`);

    // Start the WebSocket server
    const server = await startWebSocketServer();

    console.log("✅ WebSocket server started successfully!");
    console.log("📊 Connection stats:", server.getConnectionStats());
    console.log("🎯 Ready to handle real-time processing updates...");

    // Keep the process alive and show periodic stats
    const statsInterval = setInterval(() => {
      const stats = server.getConnectionStats();
      if (stats.totalClients > 0) {
        console.log(
          `📈 Active: ${stats.totalClients} clients, ${stats.activeRequests} requests`
        );
      }
    }, 30000); // Every 30 seconds

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(
        `\n⏹️  Received ${signal}, shutting down WebSocket server...`
      );
      clearInterval(statsInterval);

      // Stop the WebSocket server
      await server.stop();
      console.log("👋 WebSocket server stopped. Goodbye!");
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start WebSocket server:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
