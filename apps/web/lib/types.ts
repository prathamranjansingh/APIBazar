import { z } from 'zod';

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