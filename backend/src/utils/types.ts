import { Request } from "express";
import { NotificationType } from "@prisma/client";
import { User, ApiKey, Api, PricingModel } from '@prisma/client';

// Interface for requests with authentication (Auth0)
export interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string; // Auth0 user ID
    [key: string]: any;
  };
  user?: { id: string; auth0Id: string; email?: string };
  userId?: string;
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


//APIANALYTICS

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month';

export interface TimeSeriesOptions {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  calls: number;
  successCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface ApiUsageSummary {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  errorRate: number;
  avgResponseTime: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  percentChangeDay: number;
  percentChangeWeek: number;
  percentChangeMonth: number;
}

export interface StatusCodeBreakdown {
  statusCode: number;
  count: number;
  percentage: number;
}

export interface EndpointPerformance {
  endpoint: string;
  calls: number;
  errorRate: number;
  avgResponseTime: number;
}

export interface GeoDistribution {
  country: string;
  calls: number;
  percentage: number;
}

export interface ConsumerAnalytics {
  consumerId: string;
  consumerName?: string;
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  lastUsed: Date;
}

export interface CompleteApiAnalytics {
  apiInfo: {
    id: string;
    name: string;
    description: string;
    category: string;
    pricingModel: PricingModel;
    baseUrl: string;
  };
  summary: ApiUsageSummary;
  timeSeries: TimeSeriesDataPoint[];
  statusCodes: StatusCodeBreakdown[];
  endpoints: EndpointPerformance[];
  geoDistribution: GeoDistribution[];
  topConsumers: ConsumerAnalytics[];
  latencyPercentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

export interface UpdateMetricsDto {
  apiId: string;
  statusCode: number;
  responseTime: number;
  endpoint?: string;
  consumerId?: string;
  country?: string;
  userAgent?: string;
  timestamp?: Date;
}