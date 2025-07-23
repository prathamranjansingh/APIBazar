import winston from "winston";
import fs from "fs";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const isServer = typeof window === "undefined";

// Ensure logs directory exists (directory creation)
const logDir = path.resolve(process.cwd(), "logs");

if (isServer && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, "error.log"), "", { flag: "a" });
  fs.writeFileSync(path.join(logDir, "combined.log"), "", { flag: "a" });
}


let logger: winston.Logger;

if (isServer) {
  logger = winston.createLogger({
    level: isProd ? "info" : "debug",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: "next-app" },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
      }),
    ],
  });
} else {
  // Client-side fallback: don't write to file
  logger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  });
}

export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger };
