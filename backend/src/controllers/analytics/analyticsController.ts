import { NextFunction, Request, Response } from 'express';
import * as analyticsService from '../../services/analyticsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../utils/types';

/**
 * Helper function to simplify controller error handling
 */
const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req as AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Get complete analytics for a specific API
 */
export const getCompleteApiAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { apiId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user owns this API
  const isOwner = await analyticsService.isApiOwner(userId, apiId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this API\'s analytics'
    });
  }

  const analytics = await analyticsService.getCompleteApiAnalytics(apiId);
  if (!analytics) {
    return res.status(404).json({
      success: false,
      message: 'Analytics not found for this API'
    });
  }

  return res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Get basic analytics for a specific API
 */
export const getApiAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { apiId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user owns this API
  const isOwner = await analyticsService.isApiOwner(userId, apiId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this API\'s analytics'
    });
  }

  const analytics = await analyticsService.getApiAnalyticsWithDetails(apiId);
  if (!analytics) {
    return res.status(404).json({
      success: false,
      message: 'Analytics not found for this API'
    });
  }

  return res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Get analytics for APIs owned by the current user
 */
export const getMyApiAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const analytics = await analyticsService.getUserApiAnalytics(userId);
  return res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Get analytics for APIs purchased by the current user
 */
export const getPurchasedApiAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const analytics = await analyticsService.getPurchasedApiAnalytics(userId);
  return res.status(200).json({
    success: true,
    data: analytics
  });
});

/**
 * Get time series data for API usage
 */
export const getApiTimeSeriesData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { apiId } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user owns this API
  const isOwner = await analyticsService.isApiOwner(userId, apiId);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this API\'s analytics'
    });
  }

  const period = (req.query.period as 'hour' | 'day' | 'week' | 'month') || 'day';
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const data = await analyticsService.getApiTimeSeriesData(apiId, {
    period,
    startDate,
    endDate
  });

  return res.status(200).json({
    success: true,
    data
  });
});

/**
 * Update metrics for an API
 */
export const updateMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { apiId, statusCode, responseTime, endpoint, consumerId, userAgent, country } = req.body;

  if (!apiId || statusCode === undefined || responseTime === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: apiId, statusCode, responseTime'
    });
  }

  const updated = await analyticsService.updateApiMetrics({
    apiId,
    statusCode: Number(statusCode),
    responseTime: Number(responseTime),
    endpoint,
    consumerId,
    country,
    userAgent
  });

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'API not found or metrics update failed'
    });
  }

  return res.status(200).json({
    success: true,
    data: updated
  });
});

export default {
  getApiAnalytics,
  getMyApiAnalytics,
  getPurchasedApiAnalytics,
  updateMetrics,
  getApiTimeSeriesData,
  getCompleteApiAnalytics
};