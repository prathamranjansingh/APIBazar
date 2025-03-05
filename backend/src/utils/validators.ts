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
  name: z.string().min(3, { message: "API name must be at least 3 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  category: z.string().min(3, { message: "Category must be at least 3 characters long" }),
  pricingModel: z.nativeEnum(PricingModel),
  baseUrl: z.string().url({ message: "Invalid URL format" }),
  documentation: z.string().optional(),
  price: z.number().positive({ message: "Price must be greater than 0" }).optional(),
}).superRefine((data, ctx) => {
  if (data.pricingModel === "PAID" && (data.price === null || data.price === undefined)) {
    ctx.addIssue({
      code: "custom",
      path: ["price"],
      message: "Price is required for PAID models.",
    });
  }

  if (data.pricingModel === "FREE" && data.price !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["price"],
      message: "Price should not be provided for FREE models.",
    });
  }
});



