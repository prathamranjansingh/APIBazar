import { Request } from "express";

export interface ApiRequestBody {
    name: string;
    description: string;
    category: string;
    pricingModel: "FREE" | "PAID" | "SUBSCRIPTION";
    baseUrl: string;
    ownerId: string;
    documentation: string;
  }
  
  export interface EndpointRequestBody {
    apiId: string;
    method: string;
    path: string;
    description: string;
    headers: object;
    requestBody: object;
    response: object;
  }
  
  export interface IEndpoint {
    id: string;
    apiId: string;
    method: string;
    path: string;
    description: string;
    headers: Record<string, unknown>; 
    requestBody: Record<string, unknown>; 
    response: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
  }
  

export interface AuthenticatedRequest extends Request {
  auth?: { sub: string }; 
}
