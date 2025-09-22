#!/usr/bin/env tsx

import "dotenv/config";
import {
  checkKafkaHealth,
  createAdmin,
  IMAGE_TOPICS,
} from "../app/services/kafka.server.js";

async function main() {
  console.log("🏥 Checking Kafka cluster health...");

  try {
    // Basic connection check
    const isHealthy = await checkKafkaHealth();

    if (!isHealthy) {
      console.error("❌ Kafka cluster is unhealthy or unreachable");
      process.exit(1);
    }

    console.log("✅ Kafka cluster is healthy");

    // Check topics exist
    const admin = createAdmin();
    await admin.connect();

    const topics = await admin.listTopics();
    console.log("📋 Available topics:", topics);

    // Check if our required topics exist
    const requiredTopics = Object.values(IMAGE_TOPICS);
    const missingTopics = requiredTopics.filter(
      (topic) => !topics.includes(topic)
    );

    if (missingTopics.length > 0) {
      console.warn("⚠️  Missing required topics:", missingTopics);
      console.log("💡 Run: npm run kafka:create-topics");
    } else {
      console.log("✅ All required topics are present");
    }

    // Get cluster metadata
    try {
      const metadata = await admin.describeCluster();
      console.log("🔍 Cluster info:");
      console.log(`   Controller: ${metadata.controller}`);
      console.log(`   Brokers: ${metadata.brokers.length}`);
      console.log(`   Cluster ID: ${metadata.clusterId}`);
    } catch (error) {
      console.warn("⚠️  Could not fetch cluster metadata:", error);
    }

    await admin.disconnect();
    console.log("🎉 Health check completed successfully!");
  } catch (error) {
    console.error("❌ Health check failed:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
