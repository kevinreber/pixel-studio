#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

import "dotenv/config";
import { createAdmin, IMAGE_TOPICS } from "../app/services/kafka.server.js";

interface MonitoringStats {
  kafka: {
    isHealthy: boolean;
    brokers: string[];
    topics: Record<
      string,
      {
        partitions: number;
        messages: number;
      }
    >;
  };
  consumers: {
    groupId: string;
    members: number;
    lag: number;
  }[];
  redis: {
    isHealthy: boolean;
    activeRequests: number;
  };
  websocket: {
    isRunning: boolean;
    connections: number;
  };
}

async function getKafkaStats() {
  try {
    const admin = createAdmin();

    // Add timeout wrapper for all Kafka operations
    const timeout = (ms: number) =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), ms)
      );

    await Promise.race([admin.connect(), timeout(5000)]);

    const kafkaResults = (await Promise.race([
      Promise.all([
        admin.describeCluster(),
        admin.fetchTopicMetadata({
          topics: Object.values(IMAGE_TOPICS),
        }),
        admin.listGroups(),
      ]),
      timeout(10000),
    ])) as [any, any, any]; // Type assertion for Promise.race result

    const [cluster, topicConfigs, consumerGroups] = kafkaResults;

    const imageConsumers = (consumerGroups as any).groups.filter(
      (g: any) => g.groupId === "image-generators"
    );

    const topicStats: Record<string, { partitions: number; messages: number }> =
      {};

    for (const topic of (topicConfigs as any).topics) {
      topicStats[topic.name] = {
        partitions: topic.partitions.length,
        messages: 0, // Would need to query partition offsets for accurate count
      };
    }

    // Always disconnect, even if operations timed out
    await admin.disconnect().catch(() => {});

    return {
      isHealthy: true,
      brokers: (cluster as any).brokers.map((b: any) => `${b.host}:${b.port}`),
      topics: topicStats,
      consumers: imageConsumers.map((c: any) => ({
        groupId: c.groupId,
        members: 0, // Would need to describe group for member count
        lag: 0, // Would need offset analysis for lag
      })),
    };
  } catch (error) {
    console.error("Failed to get Kafka stats (may have timed out):", error);
    return {
      isHealthy: false,
      brokers: [],
      topics: {},
      consumers: [],
    };
  }
}

async function getRedisStats() {
  try {
    const { getProcessingStatusService } = await import(
      "../app/services/processingStatus.server.js"
    );
    const service = getProcessingStatusService();

    // Add timeout for Redis operations (5 seconds)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis operations timed out")), 5000)
    );

    const redisResults = (await Promise.race([
      Promise.all([
        service.healthCheck(),
        service.getActiveProcessingRequests(),
      ]),
      timeout,
    ])) as [boolean, unknown[]]; // Type assertion for Promise.race result

    const [isHealthy, activeRequests] = redisResults;

    return {
      isHealthy,
      activeRequests: activeRequests.length,
    };
  } catch (error) {
    console.error("Failed to get Redis stats (may have timed out):", error);
    return {
      isHealthy: false,
      activeRequests: 0,
    };
  }
}

async function getWebSocketStats() {
  try {
    // Add timeout for WebSocket health check (3 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `http://localhost:${process.env.WS_PORT || 3001}/health`,
      { signal: controller.signal }
    ).catch(() => null);

    clearTimeout(timeoutId);

    return {
      isRunning: response?.ok || false,
      connections: 0, // Would need WebSocket server to expose stats endpoint
    };
  } catch (error) {
    return {
      isRunning: false,
      connections: 0,
    };
  }
}

async function generateMonitoringReport(): Promise<MonitoringStats> {
  console.log("🔍 Gathering monitoring statistics...");

  // Add overall timeout for the entire monitoring process (20 seconds)
  const overallTimeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Overall monitoring timed out after 20 seconds")),
      20000
    )
  );

  const results = (await Promise.race([
    Promise.all([getKafkaStats(), getRedisStats(), getWebSocketStats()]),
    overallTimeout,
  ])) as [any, any, any]; // Type assertion for Promise.race result

  const [kafka, redis, websocket] = results;

  return {
    kafka,
    consumers: kafka.consumers,
    redis,
    websocket,
  };
}

async function main() {
  try {
    const stats = await generateMonitoringReport();

    console.log("\n📊 ===== KAFKA INFRASTRUCTURE MONITORING =====");
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log("\n🔸 KAFKA CLUSTER");
    console.log(
      `   Status: ${stats.kafka.isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );
    console.log(`   Brokers: ${stats.kafka.brokers.join(", ") || "None"}`);
    console.log(`   Topics: ${Object.keys(stats.kafka.topics).length}`);

    Object.entries(stats.kafka.topics).forEach(([topic, info]) => {
      console.log(`     • ${topic}: ${info.partitions} partitions`);
    });

    console.log("\n🔸 CONSUMERS");
    if (stats.consumers.length === 0) {
      console.log("   No active consumer groups");
    } else {
      stats.consumers.forEach((consumer) => {
        console.log(`   • ${consumer.groupId}: ${consumer.members} members`);
      });
    }

    console.log("\n🔸 REDIS STATUS");
    console.log(
      `   Status: ${stats.redis.isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );
    console.log(`   Active Requests: ${stats.redis.activeRequests}`);

    console.log("\n🔸 WEBSOCKET SERVER");
    console.log(
      `   Status: ${stats.websocket.isRunning ? "✅ Running" : "❌ Down"}`
    );
    console.log(`   Port: ${process.env.WS_PORT || 3001}`);

    // Overall health check
    const overallHealthy = stats.kafka.isHealthy && stats.redis.isHealthy;
    console.log(
      `\n🎯 OVERALL STATUS: ${
        overallHealthy ? "✅ HEALTHY" : "⚠️  ISSUES DETECTED"
      }`
    );

    if (!overallHealthy) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Monitoring failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateMonitoringReport };
