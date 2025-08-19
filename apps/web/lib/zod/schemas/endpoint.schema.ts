import { z } from "zod";


export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
}

export const endpointSchema = z.object({
  name: z.string().min(3, {
    message: "Endpoint name must be at least 3 characters.",
  }),

  method: z.nativeEnum(HttpMethod, {
    errorMap: () => ({ message: "You must select a valid HTTP method." }),
  }),

  path: z.string()
    .min(1, { message: "Path cannot be empty." })
    .startsWith("/", { message: "Path must start with a forward slash (/). "}),

  description: z.string().optional(),

  rateLimit: z.number().int().positive("Rate limit must be a positive number.").optional(),

  headers: z.record(z.string(), z.any()).optional(),
  requestBody: z.record(z.string(), z.any()).optional(),
  responseSchema: z.record(z.string(), z.any()).optional(),
});

export const updateEndpointSchema = endpointSchema.partial();