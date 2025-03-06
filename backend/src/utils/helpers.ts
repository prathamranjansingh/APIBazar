import crypto from "crypto";

/**
 * Generate a secure API key.
 * @param prefix Optional prefix (default: "api").
 * @returns A unique API key string.
 */
export const generateApiKey = (prefix = "api"): string => {
  const buffer = crypto.randomBytes(32);
  return `${prefix}_${buffer.toString("hex")}`;
};

/**
 * Sign a webhook payload using HMAC SHA-256.
 * @param payload Webhook data to sign.
 * @param secret Secret key for signing.
 * @returns The generated HMAC signature.
 */
export const signWebhookPayload = (payload: any, secret: string): string => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest("hex");
};

/**
 * Verify if a webhook signature is valid.
 * @param payload Webhook data.
 * @param signature Received signature.
 * @param secret Secret key used for signing.
 * @returns True if the signature is valid, otherwise false.
 */
export const verifyWebhookSignature = (
  payload: any,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Calculate the error rate of API requests.
 * @param successful Number of successful requests.
 * @param failed Number of failed requests.
 * @returns The error rate percentage.
 */
export const calculateErrorRate = (successful: number, failed: number): number => {
  const total = successful + failed;
  if (total === 0) return 0;
  return (failed / total) * 100;
};

/**
 * Sanitize an object by removing sensitive fields before logging.
 * @param obj The object to sanitize.
 * @returns A sanitized object with sensitive fields redacted.
 */
export const sanitizeForLogging = (obj: any): any => {
  if (!obj) return obj;
  const result = { ...obj };
  const sensitiveFields = ["password", "secret", "key", "token", "auth"];

  for (const field of sensitiveFields) {
    if (field in result) {
      result[field] = "[REDACTED]";
    }
  }

  return result;
};

/**
 * Format an error object for API responses.
 * @param error The error object.
 * @returns A structured error response.
 */
export const formatError = (error: any): { error: string; details?: any } => {
  if (process.env.NODE_ENV === "development") {
    return {
      error: error.message || "An error occurred",
      details: error.stack,
    };
  }
  return { error: error.message || "An error occurred" };
};
