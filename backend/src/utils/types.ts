import { Request } from "express";
import { NotificationType } from "@prisma/client";

// Interface for requests with authentication (Auth0)
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string; // Auth0 user ID
    [key: string]: any;
  };
  user?: { id: string; auth0Id: string; email?: string };
}

// Interface for notification data
export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// Interface for webhook event data
export interface WebhookData {
  apiId: string;
  event: string;
  payload: any;
}

// Interface for rate limit configuration
export interface RateLimitOptions {
  maxRequests: number;  // Number of requests allowed
  windowMs: number;     // Time window in milliseconds
  message?: string;     // Custom error message
}

// Interface for API key details
export interface ApiKeyData {
  userId: string;
  apiId: string;
  name?: string | null;
  rateLimit?: number;
  expiresAt?: Date | null;
}
