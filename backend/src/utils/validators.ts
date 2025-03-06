import { z } from "zod";

// API creation/update validation
export const apiSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().min(10).trim(),
  category: z.string().trim(),
  documentation: z.string().optional(),
  pricingModel: z.enum(["FREE", "PAID"]),
  price: z.number().positive().optional().nullable(),
  baseUrl: z.string().url(),
  rateLimit: z.number().int().positive().optional(),
});

// Endpoint validation
export const endpointSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  method: z.string().trim(),
  path: z.string().min(1).trim(),
  description: z.string().optional(),
  headers: z.any().optional(),
  requestBody: z.any().optional(),
  responseSchema: z.any().optional(),
  rateLimit: z.number().int().positive().optional(),
});

// Review validation
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5).int(),
  comment: z.string().optional().nullable(),
});

// Webhook creation validation
export const webhookSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

// API key creation validation
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rateLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Notification status update validation
export const notificationSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// Profile update validation
export const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().nullable(),
  company: z.string().max(100).optional().nullable(),
});
