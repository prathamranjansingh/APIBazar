import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/types";
import * as apiService from "../../services/apiService";
import { apiSchema } from "../../utils/validators";

export const getAllApis = async (req: Request, res: Response): Promise<void> => {
  try {
    const apis = await apiService.getAllApis();
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
    const api = await apiService.createApi(req.auth.sub, validated.data);
    res.status(201).json(api);
  } catch (error) {
    res.status(500).json({ error: "Failed to create API" });
  }
};

export const getApiById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const api = await apiService.getApiById(id);
    
    if (!api) {
      res.status(404).json({ error: "API not found" });
      return; 
    }    
    res.json(api); 
  } catch (error) {
    next(error); 
  }
};
