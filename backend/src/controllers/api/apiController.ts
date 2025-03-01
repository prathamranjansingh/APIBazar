import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ApiRequestBody, EndpointRequestBody } from "../../utils/types";
import { AuthenticatedRequest } from "../../utils/types";
import { apiSchema } from "../../utils/validators";
const prisma = new PrismaClient();

export const getAllApis = async (req: Request, res: Response): Promise<void> => {
  try {
    const apis = await prisma.api.findMany({ include: { endpoints: true } });
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch APIs" });
  }
};


export const createApi = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  if (!req.auth?.sub) return res.status(401).json({ error: "Unauthorized" });

  const validated = apiSchema.safeParse(req.body);
  if (!validated.success) {
    return res.status(400).json({ error: validated.error.format() });
  }

  try {
    const api = await prisma.api.create({
      data: {
        ...validated.data,
        ownerId: req.auth.sub,
        documentation: validated.data.documentation ?? "",
      },
    });
    res.status(201).json(api);
  } catch (error) {
    res.status(500).json({ error: "Failed to create API" });
  }
};




export const getApiById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const api = await prisma.api.findUnique({ where: { id }, include: { endpoints: true } });
    if (!api) return res.status(404).json({ error: "API not found" });
    res.json(api);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch API" });
  }
};
