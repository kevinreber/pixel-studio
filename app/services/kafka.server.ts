import { Kafka } from "kafkajs";

const isTestEnvironment = process.env.CI === "true" || process.env.NODE_ENV === "test";

// Kafka client configuration
const kafka = isTestEnvironment
  ? (null as unknown as Kafka) // Mock Kafka in test environment
  : new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || "pixel-studio",
      brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
      ssl: process.env.KAFKA_SSL === "true",
      sasl:
        process.env.KAFKA_SSL === "true"
          ? {
              mechanism: "scram-sha-512",
              username: process.env.KAFKA_SASL_USERNAME!,
              password: process.env.KAFKA_SASL_PASSWORD!,
            }
          : undefined,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

// Topic definitions for image generation pipeline
export const IMAGE_TOPICS = {
  GENERATION_REQUESTS: "image.generation.requests",
  GENERATION_STATUS: "image.generation.status",
  GENERATION_COMPLETE: "image.generation.complete",
  GENERATION_FAILED: "image.generation.failed",
} as const;

// Producer instance with error handling
export const createProducer = () => {
  const producer = kafka.producer({
    maxInFlightRequests: 1,
    idempotent: true,
    transactionTimeout: 30000,
  });

  return producer;
};

// Consumer instance with configuration
export const createConsumer = (groupId: string) => {
  return kafka.consumer({
    groupId,
    sessionTimeout: 45000, // Increased to prevent frequent rebalancing
    heartbeatInterval: 5000, // Increased heartbeat interval
    maxBytesPerPartition: 1048576,
    allowAutoTopicCreation: false,
    maxWaitTimeInMs: 5000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  });
};

// Admin client for topic management
export const createAdmin = () => {
  return kafka.admin();
};

// Health check function
export const checkKafkaHealth = async (): Promise<boolean> => {
  try {
    const admin = createAdmin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    return true;
  } catch (error) {
    console.error("Kafka health check failed:", error);
    return false;
  }
};

// Topic creation utility
export const createTopicsIfNotExists = async () => {
  const admin = createAdmin();

  try {
    await admin.connect();

    const existingTopics = await admin.listTopics();
    const topicsToCreate = Object.values(IMAGE_TOPICS).filter(
      (topic) => !existingTopics.includes(topic)
    );

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate.map((topic) => ({
          topic,
          numPartitions: topic === IMAGE_TOPICS.GENERATION_REQUESTS ? 6 : 3,
          replicationFactor: process.env.NODE_ENV === "production" ? 3 : 1,
          configEntries: [
            { name: "cleanup.policy", value: "delete" },
            {
              name: "retention.ms",
              value: topic.includes("status") ? "86400000" : "604800000", // 1 day for status, 7 days for others
            },
          ],
        })),
      });

      console.log(`Created Kafka topics: ${topicsToCreate.join(", ")}`);
    }
  } catch (error) {
    console.error("Failed to create topics:", error);
    throw error;
  } finally {
    await admin.disconnect();
  }
};

export { kafka };
