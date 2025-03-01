import { Request, Response } from "express";
import { PrismaClient, Prisma  } from "@prisma/client";
import { AuthenticatedRequest, EndpointRequestBody } from "../../utils/types";

const prisma = new PrismaClient();


export const addEndpoint = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  const { apiId, method, path, description, headers, requestBody, response }: EndpointRequestBody = req.body;

  try {
    const api = await prisma.api.findUnique({ where: { id: apiId } });
    if (!api) return res.status(404).json({ error: "API not found" });

    if (api.ownerId !== req.auth?.sub) {
      return res.status(403).json({ error: "Forbidden: You do not own this API" });
    }

    const endpoint = await prisma.endpoint.create({
      data: { apiId, method, path, description, headers, requestBody, response },
    });

    return res.status(201).json(endpoint);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create endpoint" });
  }
};

export const getEndpointsByApi = async (req: Request, res: Response) => {
  const { apiId } = req.params;

  try {
    const endpoints = await prisma.endpoint.findMany({
      where: { apiId },
    });

    const parsedEndpoints = endpoints.map(endpoint => ({
      ...endpoint,
      headers: endpoint.headers ? JSON.parse(endpoint.headers as string) : null,
      requestBody: endpoint.requestBody ? JSON.parse(endpoint.requestBody as string) : null,
      response: endpoint.response ? JSON.parse(endpoint.response as string) : null,
    }));

    res.json(parsedEndpoints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch endpoints" });
  }
};


export const deleteEndpoint = async (req: Request, res: Response) => {
  const { endpointId } = req.params;

  try {
    await prisma.endpoint.delete({
      where: { id: endpointId },
    });
    res.json({ message: "Endpoint deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete endpoint" });
  }
};
