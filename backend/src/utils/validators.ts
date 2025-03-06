import { z } from "zod";

export const userRegistrationSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  name: z.string().min(3, "Name must be at least 3 characters long"),
  auth0Id: z.string().min(5, "Invalid Auth0 ID"),
  picture: z.string().url().optional(),
});

export const userLoginSchema = z.object({
  auth0Id: z.string().min(5, "Invalid Auth0 ID"),
});


export const apiSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  documentation: z.string().optional(),
  pricingModel: z.enum(["FREE", "PAID"]),
  price: z.number().optional(),
  baseUrl: z.string().url(),
  rateLimit: z.number().default(100),
});