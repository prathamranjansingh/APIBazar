import { z } from "zod";
import { PricingModel } from "@prisma/client";


const apiSchemaBase = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  category: z.string(),
  baseURL: z.string().url("Invalid base URL"),
  pricingModel: z.nativeEnum(PricingModel),
  price: z.number().positive("Price must be a positive number").optional().nullable(),
  rateLimit: z.number().int().min(1).optional().default(100),
  documentation: z.string().optional(),
});


export const apiSchema = apiSchemaBase.refine(
  (data) => {
    if (data.pricingModel === "PAID") {
      return typeof data.price === "number" && data.price > 0;
    }
    return true;
  },
  {
    message: "Price is required for PAID models and must be greater than 0.",
    path: ["price"],
  }
);

export const updateApiSchema = apiSchemaBase.partial();

export const listApisSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
