import { z } from "zod";
import { PricingModel } from "@prisma/client";

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
  name: z.string().min(3, "API name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  category: z.string().min(3, "Category must be at least 3 characters long"),
  pricingModel: z.nativeEnum(PricingModel),
  baseUrl: z.string().url("Invalid URL format"),
  documentation: z.string().optional(),
});
