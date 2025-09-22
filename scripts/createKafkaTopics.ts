#!/usr/bin/env tsx

import "dotenv/config";
import {
  createTopicsIfNotExists,
  checkKafkaHealth,
} from "../app/services/kafka.server.js";

async function main() {
  console.log("🔧 Creating Kafka topics for image generation pipeline...");

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

    // Create topics
    await createTopicsIfNotExists();
    console.log("🎉 All topics created successfully!");
  } catch (error) {
    console.error("❌ Failed to create Kafka topics:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
