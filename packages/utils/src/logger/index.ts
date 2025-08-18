import winston from "winston";
import "winston-daily-rotate-file";

const isProd = process.env.NODE_ENV === "production";


const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});


const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  levels,
  format: isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
});

// In production, add file transports for persistent, rotating logs
if (isProd) {
  logger.add(
    new winston.transports.DailyRotateFile({
      level: "error",
      filename: "logs/error-%DATE%.log", // e.g., error-2025-08-18.log
      datePattern: "YYYY-MM-DD",
      zippedArchive: true, // Compress old log files
      maxSize: "20m",      // Max file size before rotation
      maxFiles: "14d",     // Keep logs for 14 days
    })
  );
  logger.add(
    new winston.transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    })
  );
}


export const logStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export { logger };