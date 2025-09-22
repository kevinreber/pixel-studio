#!/usr/bin/env tsx

import "dotenv/config";
import { checkKafkaHealth } from "../app/services/kafka.server.js";

async function main() {
  console.log("🚀 Starting Kafka consumers for image generation pipeline...");

  try {
    // First check if Kafka is running
    console.log("📡 Checking Kafka connection...");
    const isHealthy = await checkKafkaHealth();

    if (!isHealthy) {
      console.error(
        "❌ Kafka is not available. Please ensure Kafka is running."
      );
      console.log(
        "💡 For local development, run: docker-compose -f docker-compose.kafka.yml up -d"
      );
      process.exit(1);
    }

    console.log("✅ Kafka connection established");

    // Check if feature flag is enabled
    if (process.env.ENABLE_KAFKA_IMAGE_GENERATION !== "true") {
      console.log(
        "⏸️  Kafka image generation is disabled. Set ENABLE_KAFKA_IMAGE_GENERATION=true to enable."
      );
      process.exit(0);
    }

    console.log("🔄 Starting image generation workers...");

    // Import the worker pool
    const { ImageGenerationWorkerPool } = await import(
      "../app/services/imageGenerationWorker.server.js"
    );

    // Create worker pool with configurable number of workers
    const maxWorkers = parseInt(process.env.PROCESSING_WORKER_INSTANCES || "3");
    const workerPool = new ImageGenerationWorkerPool(maxWorkers);

    // Start all workers
    await workerPool.startWorkers();

    console.log(`✅ Started ${maxWorkers} image generation workers`);
    console.log("📊 Worker status:", workerPool.getWorkerStatus());
    console.log("🎯 Workers are now processing image generation requests...");

    // Keep the process alive
    const keepAlive = setInterval(() => {
      const status = workerPool.getWorkerStatus();
      const healthyWorkers = status.filter((w) => w.isHealthy).length;
      console.log(`💓 Workers alive: ${healthyWorkers}/${status.length}`);
    }, 30000); // Check every 30 seconds

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(
        `\n⏹️  Received ${signal}, shutting down workers gracefully...`
      );
      clearInterval(keepAlive);
      await workerPool.stopWorkers();
      console.log("👋 All workers stopped. Goodbye!");
      process.exit(0);
    };

    // Override the existing signal handlers with our graceful shutdown
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start consumers:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
