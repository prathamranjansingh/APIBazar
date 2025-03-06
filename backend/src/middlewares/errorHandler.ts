// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { formatError } from "../utils/helpers";

/**
 * Global error handler middleware
 * - Logs errors with status, stack trace, and request details.
 * - Sends a structured JSON response with error details.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";

  // Log the error details
  logger.error(`Error: ${message}`, {
    status,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Send formatted error response
  res.status(status).json(formatError(err));
};

/**
 * 404 Not Found handler middleware
 * - Must be placed after all defined routes.
 * - Responds when no other route matches the request.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: "Not Found",
    message: `The requested resource '${req.path}' does not exist`
  });
};
