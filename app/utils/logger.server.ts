import winston from "winston";
import { SeverityNumber } from "@opentelemetry/api-logs";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";

// Custom format for development that's more readable
const devFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }

    return msg;
  }
);

// Create the winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Always write to console
    new winston.transports.Console({
      // Use different format for development
      format:
        process.env.NODE_ENV === "development"
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              devFormat
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            ),
    }),
  ],
});

// ============================================
// OpenTelemetry Logger for PostHog Logs
// ============================================

type OTelLogger = ReturnType<LoggerProvider["getLogger"]>;

let otelLoggerInstance: OTelLogger | null = null;
let otelLoggerProvider: LoggerProvider | null = null;
let otelInitAttempted = false;

function initOTelLogger(): OTelLogger | null {
  if (otelInitAttempted) return otelLoggerInstance;
  otelInitAttempted = true;

  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;

  try {
    const host = (
      process.env.POSTHOG_HOST || "https://us.i.posthog.com"
    ).replace(/\/+$/, "");

    const resource = resourceFromAttributes({
      "service.name": "pixel-studio",
      "deployment.environment": process.env.NODE_ENV || "development",
    });

    const exporter = new OTLPLogExporter({
      url: `${host}/i/v1/logs`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    otelLoggerProvider = new LoggerProvider({
      resource,
      processors: [new BatchLogRecordProcessor(exporter)],
    });

    otelLoggerInstance = otelLoggerProvider.getLogger("pixel-studio");
  } catch (error) {
    console.error("[Logger] Failed to initialize OpenTelemetry:", error);
  }

  return otelLoggerInstance;
}

const SEVERITY_MAP: Record<string, SeverityNumber> = {
  error: SeverityNumber.ERROR,
  warn: SeverityNumber.WARN,
  info: SeverityNumber.INFO,
  debug: SeverityNumber.DEBUG,
  verbose: SeverityNumber.TRACE,
};

/**
 * Sanitize metadata into OTel-compatible attributes (primitives only).
 */
function toOTelAttributes(
  metadata?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!metadata) return undefined;
  const attrs: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      attrs[key] = value;
    } else if (value !== null && value !== undefined) {
      attrs[key] = JSON.stringify(value);
    }
  }
  return attrs;
}

function emitOTelLog(
  level: string,
  message: string,
  attributes?: Record<string, unknown>
): void {
  const otelLogger = initOTelLogger();
  if (!otelLogger) return;

  try {
    otelLogger.emit({
      severityNumber: SEVERITY_MAP[level] ?? SeverityNumber.UNSPECIFIED,
      severityText: level.toUpperCase(),
      body: message,
      attributes: toOTelAttributes(attributes),
    });
  } catch {
    // Silently fail - logging should never break the app
  }
}

// Wrapper class to maintain consistent API across the app
export class Logger {
  static info(params: {
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    logger.info(params.message, params.metadata);
    emitOTelLog("info", params.message, params.metadata);
  }

  static warn(params: {
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    logger.warn(params.message, params.metadata);
    emitOTelLog("warn", params.message, params.metadata);
  }

  static error(params: {
    message: string;
    error?: Error;
    metadata?: Record<string, unknown>;
  }) {
    logger.error(params.message, {
      error: params.error,
      ...params.metadata,
      stack: params.error?.stack,
    });
    emitOTelLog("error", params.message, {
      ...params.metadata,
      errorName: params.error?.name,
      errorMessage: params.error?.message,
      errorStack: params.error?.stack,
    });
  }
}

/**
 * Gracefully shutdown the OpenTelemetry logger provider.
 * Call this on server shutdown to flush pending logs.
 */
export async function shutdownLogger(): Promise<void> {
  if (otelLoggerProvider) {
    await otelLoggerProvider.shutdown();
  }
}
