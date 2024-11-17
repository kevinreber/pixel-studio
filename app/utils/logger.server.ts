import winston from "winston";

// Custom format for development that's more readable
const devFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

// Create the logger instance
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
      format: process.env.NODE_ENV === "development"
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            devFormat
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
    }),
  ],
});

// Wrapper class to maintain consistent API across the app
export class Logger {
  static info(params: { message: string; metadata?: Record<string, unknown> }) {
    logger.info(params.message, params.metadata);
  }

  static warn(params: { message: string; metadata?: Record<string, unknown> }) {
    logger.warn(params.message, params.metadata);
  }

  static error(params: { 
    message: string; 
    error?: Error; 
    metadata?: Record<string, unknown> 
  }) {
    logger.error(params.message, {
      error: params.error,
      ...params.metadata,
      stack: params.error?.stack
    });
  }
} 