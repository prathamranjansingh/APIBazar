import { z } from 'zod';
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    cache?: {
      hit: boolean;
      ttl?: number;
    };
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    keyName?: string;
    in?: 'header' | 'query';
  };
  timeout?: number;
}

export interface TestResponse {
  success: boolean;
  duration: number;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    data: any;
    size: number;
  };
  error?: {
    message: string;
    code: string;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    data: any;
  };
  publicTesting?: {
    limited: boolean;
    truncated: boolean;
    message: string;
    rateLimit: number;
  };
}

export const plans = [
  "free",
  "pro",
  "business",
  "business plus",
  "business extra",
  "business max",
  "advanced",
  "enterprise",
] as const;

export type PlanProps = (typeof plans)[number];
