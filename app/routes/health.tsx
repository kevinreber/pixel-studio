import { json } from "@remix-run/node";
import { prisma } from "~/services/prisma.server";
import { redis, safeRedisOperation } from "~/services/redis.server";

/**
 * Health check endpoint for monitoring and deployment verification
 *
 * Returns:
 * - 200 OK if all services are healthy
 * - 503 Service Unavailable if any critical service is down
 *
 * Checks:
 * - Database connectivity (PostgreSQL)
 * - Redis cache connectivity
 * - Basic application health
 */
export const loader = async () => {
  const startTime = Date.now();
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  const errors: string[] = [];

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error("Health check - Database error:", error);
    errors.push("Database connection failed");
  }

  // Check Redis connectivity
  try {
    await safeRedisOperation(() => redis.ping());
    checks.redis = true;
  } catch (error) {
    console.error("Health check - Redis error:", error);
    errors.push("Redis connection failed");
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = checks.database && checks.redis;

  const healthData = {
    status: isHealthy ? "healthy" : "unhealthy",
    version: process.env.npm_package_version || "1.0.0",
    checks,
    errors: errors.length > 0 ? errors : undefined,
    performance: {
      responseTime: `${responseTime}ms`,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
      },
      uptime: Math.floor(process.uptime()) + "s",
    },
    services: {
      kafkaEnabled: process.env.ENABLE_KAFKA_IMAGE_GENERATION === "true",
      websocketPort: process.env.WS_PORT || "3001",
    },
  };

  // Return appropriate HTTP status
  const status = isHealthy ? 200 : 503;

  // Add cache headers to prevent caching of health checks
  const headers = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  return json(healthData, { status, headers });
};

/**
 * Simple health check component for browser access
 * Shows a basic health status page
 */
export default function HealthCheck() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>🏥 Pixel Studio Health Check</h1>
      <p>
        This endpoint provides health status information for monitoring and
        deployment verification.
      </p>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "1rem",
          borderRadius: "4px",
          marginTop: "1rem",
        }}
      >
        <h2>For API Access:</h2>
        <p>Make a GET request to this endpoint to receive JSON health data:</p>
        <code
          style={{
            backgroundColor: "#e0e0e0",
            padding: "0.5rem",
            borderRadius: "2px",
            display: "block",
            marginTop: "0.5rem",
          }}
        >
          curl -H &quot;Accept: application/json&quot;{" "}
          {typeof window !== "undefined" ? window.location.href : "/health"}
        </code>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Health Checks Include:</h2>
        <ul>
          <li>✅ Database connectivity (PostgreSQL)</li>
          <li>✅ Redis cache connectivity</li>
          <li>✅ Application performance metrics</li>
          <li>✅ Service configuration status</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#e8f5e8",
          borderRadius: "4px",
        }}
      >
        <p>
          <strong>Status:</strong> If you can see this page, the web application
          is running.
        </p>
        <p>
          <strong>For detailed status:</strong> Check the JSON response from
          this endpoint.
        </p>
      </div>
    </div>
  );
}
