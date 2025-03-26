import { PrismaClient, ApiAnalytics, Api } from '@prisma/client';
import {
  TimeSeriesOptions,
  TimeSeriesDataPoint,
  ApiUsageSummary,
  StatusCodeBreakdown,
  EndpointPerformance,
  GeoDistribution,
  ConsumerAnalytics,
  CompleteApiAnalytics,
  UpdateMetricsDto
} from '../utils/types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getApiAnalytics = async (apiId: string): Promise<ApiAnalytics | null> => {
  try {
    return await prisma.apiAnalytics.findUnique({
      where: { apiId }
    });
  } catch (error) {
    logger.error("Error fetching API analytics:", error);
    return null;
  }
};

export const getApiAnalyticsWithDetails = async (apiId: string): Promise<(ApiAnalytics & { api: Api }) | null> => {
  try {
    return await prisma.apiAnalytics.findUnique({
      where: { apiId },
      include: {
        api: true
      }
    });
  } catch (error) {
    logger.error("Error fetching API analytics with details:", error);
    return null;
  }
};

export const getAllApiAnalytics = async (
  page = 1,
  limit = 10,
  sortBy = 'totalCalls',
  order: 'asc' | 'desc' = 'desc'
): Promise<{
  data: (ApiAnalytics & { api: Api })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> => {
  try {
    const skip = (page - 1) * limit;
    const [analytics, total] = await Promise.all([
      prisma.apiAnalytics.findMany({
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order
        },
        include: {
          api: true
        }
      }),
      prisma.apiAnalytics.count()
    ]);
    
    return {
      data: analytics,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error("Error fetching all API analytics:", error);
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }
};

export const getUserApiAnalytics = async (userId: string): Promise<(ApiAnalytics & { api: Api })[]> => {
  try {
    console.log(`Fetching APIs for user: ${userId}`);

    const userApis = await prisma.api.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    console.log(`Found APIs:`, userApis);

    const apiIds = userApis.map(api => api.id);
    if (apiIds.length === 0) {
      console.warn(`User ${userId} has no APIs`);
      return [];
    }

    const analytics = await prisma.apiAnalytics.findMany({
      where: { apiId: { in: apiIds } },
      include: { api: true },
    });

    console.log(`Returning analytics:`, analytics);
    return analytics;
  } catch (error) {
    console.error(`Error fetching analytics for user ${userId}:`, error);
    return [];
  }
};


export const getPurchasedApiAnalytics = async (userId: string): Promise<(ApiAnalytics & { api: Api })[]> => {
  try {
    const purchasedApis = await prisma.purchasedAPI.findMany({
      where: {
        userId
      },
      select: {
        apiId: true
      }
    });
    
    const apiIds = purchasedApis.map(purchase => purchase.apiId);
    
    if (apiIds.length === 0) {
      return [];
    }
    
    return await prisma.apiAnalytics.findMany({
      where: {
        apiId: {
          in: apiIds
        }
      },
      include: {
        api: true
      }
    });
  } catch (error) {
    logger.error(`Error fetching analytics for purchased APIs by user ${userId}:`, error);
    return [];
  }
};

export const updateApiMetrics = async (data: UpdateMetricsDto): Promise<ApiAnalytics | null> => {
  try {
    const {
      apiId,
      statusCode,
      responseTime,
      endpoint,
      consumerId,
      country,
      userAgent,
      timestamp = new Date()
    } = data;
    
    return await prisma.$transaction(async (tx) => {
      const analytics = await tx.apiAnalytics.findUnique({
        where: { apiId }
      });
      
      if (!analytics) {
        logger.error(`Analytics not found for API: ${apiId}`);
        return null;
      }
      
      const isSuccess = statusCode >= 200 && statusCode < 400;
      const newTotalCalls = analytics.totalCalls + 1;
      const newSuccessCalls = isSuccess ? analytics.successCalls + 1 : analytics.successCalls;
      const newFailedCalls = !isSuccess ? analytics.failedCalls + 1 : analytics.failedCalls;
      const newErrorRate = (newFailedCalls / newTotalCalls) * 100;
      const newResponseTimeAvg = ((analytics.responseTimeAvg * analytics.totalCalls) + responseTime) / newTotalCalls;
      
      const updatedAnalytics = await tx.apiAnalytics.update({
        where: { apiId },
        data: {
          totalCalls: newTotalCalls,
          successCalls: newSuccessCalls,
          failedCalls: newFailedCalls,
          errorRate: newErrorRate,
          responseTimeAvg: newResponseTimeAvg
        }
      });
      
      await tx.apiCallLog.create({
        data: {
          apiId,
          statusCode,
          responseTime,
          endpoint,
          consumerId,
          country,
          userAgent,
          timestamp
        }
      });
      
      return updatedAnalytics;
    });
  } catch (error) {
    logger.error(`Error updating metrics for API ${data.apiId}:`, error);
    return null;
  }
};

export const getApiTimeSeriesData = async (
  apiId: string,
  options: TimeSeriesOptions
): Promise<TimeSeriesDataPoint[]> => {
  try {
    const { period = 'day', startDate, endDate } = options;
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;
    
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      switch(period) {
        case 'hour': start.setHours(start.getHours() - 24); break;
        case 'day': start.setDate(start.getDate() - 30); break;
        case 'week': start.setDate(start.getDate() - 90); break;
        case 'month': start.setMonth(start.getMonth() - 12); break;
      }
    }
    
    let dateFormat: string;
    switch(period) {
      case 'hour': dateFormat = 'YYYY-MM-DD HH24:00:00'; break;
      case 'day': dateFormat = 'YYYY-MM-DD'; break;
      case 'week': dateFormat = 'YYYY-WW'; break;
      case 'month': dateFormat = 'YYYY-MM'; break;
    }
    
    const timeSeriesData = await prisma.$queryRaw<Array<{
      time_bucket: string;
      calls: number;
      success_calls: number;
      failed_calls: number;
      avg_response_time: number;
      error_rate: number;
    }>>`
      SELECT
        TO_CHAR(DATE_TRUNC(${period}, "timestamp"), ${dateFormat}) as time_bucket,
        COUNT(*) as calls,
        SUM(CASE WHEN "statusCode" >= 200 AND "statusCode" < 400 THEN 1 ELSE 0 END) as success_calls,
        SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END) as failed_calls,
        AVG("responseTime") as avg_response_time,
        (SUM(CASE WHEN "statusCode" >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as error_rate
      FROM "ApiCallLog"
      WHERE
        "apiId" = ${apiId}
        AND "timestamp" >= ${start}
        AND "timestamp" <= ${end}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;
    
    return timeSeriesData.map(point => ({
      timestamp: point.time_bucket,
      calls: Number(point.calls),
      successCalls: Number(point.success_calls),
      failedCalls: Number(point.failed_calls),
      avgResponseTime: Number(point.avg_response_time),
      errorRate: Number(point.error_rate)
    }));
  } catch (error) {
    logger.error(`Error fetching time series data for API ${apiId}:`, error);
    return [];
  }
};

export const getCompleteApiAnalytics = async (apiId: string): Promise<CompleteApiAnalytics | null> => {
  try {
    const api = await prisma.api.findUnique({
      where: { id: apiId }
    });
    
    if (!api) {
      logger.error(`API not found: ${apiId}`);
      return null;
    }
    
    const analytics = await prisma.apiAnalytics.findUnique({
      where: { apiId }
    });
    
    if (!analytics) {
      logger.error(`Analytics not found for API: ${apiId}`);
      return null;
    }
    
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const [
      callsToday,
      callsYesterday,
      callsThisWeek,
      callsLastWeek,
      callsThisMonth,
      callsLastMonth,
      timeSeriesData,
      statusCodes,
      endpointPerformance,
      geoDistribution,
      topConsumers,
      latencyPercentiles
    ] = await Promise.all([
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: todayStart } } }),
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: weekStart } } }),
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: lastWeekStart, lt: weekStart } } }),
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: monthStart } } }),
      prisma.apiCallLog.count({ where: { apiId, timestamp: { gte: lastMonthStart, lt: monthStart } } }),
      getApiTimeSeriesData(apiId, { period: 'day', startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString() }),
      prisma.$queryRaw<Array<StatusCodeBreakdown>>`
        SELECT 
          "statusCode", 
          COUNT(*) as count, 
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "ApiCallLog" WHERE "apiId" = ${apiId})) as percentage
        FROM "ApiCallLog"
        WHERE "apiId" = ${apiId}
        GROUP BY "statusCode"
      `,
      prisma.$queryRaw<Array<EndpointPerformance>>`
        SELECT 
          endpoint, 
          COUNT(*) as calls, 
          AVG("responseTime") as "avgResponseTime",
          (COUNT(*) FILTER (WHERE "statusCode" >= 400) * 100.0 / COUNT(*)) as "errorRate"
        FROM "ApiCallLog"
        WHERE "apiId" = ${apiId}
        GROUP BY endpoint
      `,
      prisma.$queryRaw<Array<GeoDistribution>>`
        SELECT 
          country, 
          COUNT(*) as calls, 
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "ApiCallLog" WHERE "apiId" = ${apiId})) as percentage
        FROM "ApiCallLog"
        WHERE "apiId" = ${apiId}
        GROUP BY country
      `,
      prisma.$queryRaw<Array<ConsumerAnalytics>>`
        SELECT 
          "consumerId", 
          COUNT(*) as "totalCalls", 
          (COUNT(*) FILTER (WHERE "statusCode" < 400) * 100.0 / COUNT(*)) as "successRate",
          AVG("responseTime") as "avgResponseTime",
          MAX(timestamp) as "lastUsed"
        FROM "ApiCallLog"
        WHERE "apiId" = ${apiId}
        GROUP BY "consumerId"
        ORDER BY "totalCalls" DESC
        LIMIT 10
      `,
      prisma.$queryRaw<Array<{p50: number, p90: number, p95: number, p99: number}>>`
        SELECT 
          PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "responseTime") as p50,
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "responseTime") as p90,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "responseTime") as p95,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "responseTime") as p99
        FROM "ApiCallLog"
        WHERE "apiId" = ${apiId}
      `
    ]);
    
    const percentChangeDay = callsYesterday === 0 ? 100 : ((callsToday - callsYesterday) / callsYesterday) * 100;
    const percentChangeWeek = callsLastWeek === 0 ? 100 : ((callsThisWeek - callsLastWeek) / callsLastWeek) * 100;
    const percentChangeMonth = callsLastMonth === 0 ? 100 : ((callsThisMonth - callsLastMonth) / callsLastMonth) * 100;
    
    return {
      apiInfo: {
        id: api.id,
        name: api.name,
        description: api.description,
        category: api.category,
        pricingModel: api.pricingModel,
        baseUrl: api.baseUrl
      },
      summary: {
        totalCalls: analytics.totalCalls,
        successCalls: analytics.successCalls,
        failedCalls: analytics.failedCalls,
        errorRate: analytics.errorRate,
        avgResponseTime: analytics.responseTimeAvg,
        callsToday,
        callsThisWeek,
        callsThisMonth,
        percentChangeDay,
        percentChangeWeek,
        percentChangeMonth
      },
      timeSeries: timeSeriesData,
      statusCodes: statusCodes.map(sc => ({
        statusCode: sc.statusCode,
        count: Number(sc.count),
        percentage: Number(sc.percentage)
      })),
      endpoints: endpointPerformance.map(ep => ({
        endpoint: ep.endpoint,
        calls: Number(ep.calls),
        errorRate: Number(ep.errorRate),
        avgResponseTime: Number(ep.avgResponseTime)
      })),
      geoDistribution: geoDistribution.map(geo => ({
        country: geo.country,
        calls: Number(geo.calls),
        percentage: Number(geo.percentage)
      })),
      topConsumers: topConsumers.map(consumer => ({
        consumerId: consumer.consumerId,
        totalCalls: Number(consumer.totalCalls),
        successRate: Number(consumer.successRate),
        avgResponseTime: Number(consumer.avgResponseTime),
        lastUsed: consumer.lastUsed
      })),
      latencyPercentiles: latencyPercentiles.length > 0 ? {
        p50: Number(latencyPercentiles[0].p50),
        p90: Number(latencyPercentiles[0].p90),
        p95: Number(latencyPercentiles[0].p95),
        p99: Number(latencyPercentiles[0].p99)
      } : {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0
      }
    };
  } catch (error) {
    logger.error(`Error fetching complete analytics for API ${apiId}:`, error);
    return null;
  }
};

export const createInitialAnalytics = async (apiId: string): Promise<ApiAnalytics | null> => {
  try {
    return await prisma.apiAnalytics.create({
      data: {
        apiId,
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        errorRate: 0,
        responseTimeAvg: 0
      }
    });
  } catch (error) {
    logger.error(`Error creating initial analytics for API ${apiId}:`, error);
    return null;
  }
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