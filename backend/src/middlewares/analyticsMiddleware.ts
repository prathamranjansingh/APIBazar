import { Request, Response, NextFunction } from 'express';
import { updateApiMetrics } from '../services/analyticsService';
import { logger } from '../utils/logger';
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from '../utils/types';
const prisma = new PrismaClient();
interface TrackedRequest extends Request {
  apiId?: string;
  consumerId?: string;
}

export const trackApiMetrics = (req: TrackedRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { apiId, consumerId } = req;

  if (!apiId) {
    return next();
  }

  const originalEnd = res.end.bind(res);

  res.end = ((...args: Parameters<Response["end"]>) => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    updateApiMetrics({
      apiId,
      statusCode,
      responseTime,
      endpoint: req.originalUrl || req.url,
      consumerId,
      userAgent: req.headers['user-agent'] as string,
    }).catch(error => {
      logger.error(`Failed to track API metrics for ${apiId}:`, error);
    });

    return originalEnd(...args);
  }) as Response["end"];

  next();
};

export const isApiOwner = async (userId: string, apiId: string): Promise<boolean> => {
    try {
      const api = await prisma.api.findFirst({
        where: {
          id: apiId,
          ownerId: userId
        }
      });
      return !!api;
    } catch (error) {
      logger.error(`Error checking API ownership: ${error}`);
      return false;
    }
  };
  
export const checkApiOwner = (async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { apiId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const isOwner = await isApiOwner(userId, apiId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this API's analytics",
      });
    }

    next(); // Continue to the next middleware or controller
  } catch (error) {
    next(error); // Pass errors to Express error handler
  }
}) as (req: Request, res: Response, next: NextFunction) => void; // Explicitly type as Express middleware

  
