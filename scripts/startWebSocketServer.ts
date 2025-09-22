#!/usr/bin/env tsx

import "dotenv/config";
import { startWebSocketServer } from "../app/services/websocket.server.js";

async function main() {
  console.log(
    "🚀 Starting WebSocket server for real-time processing updates..."
  );

  try {
    // Check if feature is enabled
    if (process.env.ENABLE_KAFKA_IMAGE_GENERATION !== "true") {
      console.log(
        "⏸️  Kafka image generation is disabled. WebSocket server not needed."
      );
      process.exit(0);
    }

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
