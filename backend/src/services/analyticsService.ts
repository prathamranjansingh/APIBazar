// src/services/analyticsService.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { calculateErrorRate } from "../utils/helpers";

const prisma = new PrismaClient();

/**
 * Record a successful API call.
 * Updates analytics for the given API.
 */
export const recordSuccessfulCall = async (apiId: string, responseTimeMs: number): Promise<void> => {
  try {
    // Fetch current successCalls and responseTimeAvg
    const analytics = await prisma.apiAnalytics.findUnique({
      where: { apiId },
      select: { successCalls: true, responseTimeAvg: true }
    });

    let newResponseTimeAvg = responseTimeMs; // Default if no previous data
    if (analytics && analytics.successCalls > 0) {
      newResponseTimeAvg = 
        (analytics.responseTimeAvg * analytics.successCalls + responseTimeMs) / (analytics.successCalls + 1);
    }

    // Perform the update with calculated values
    await prisma.apiAnalytics.upsert({
      where: { apiId },
      update: {
        totalCalls: { increment: 1 },
        successCalls: { increment: 1 },
        responseTimeAvg: newResponseTimeAvg, // Pass as number instead of raw query
        lastUpdated: new Date()
      },
      create: {
        apiId,
        totalCalls: 1,
        successCalls: 1,
        failedCalls: 0,
        errorRate: 0,
        responseTimeAvg: responseTimeMs
      }
    });
  } catch (error) {
    logger.error("Error recording successful API call:", error);
  }
};


/**
 * Record a failed API call.
 * Updates failure count and recalculates error rate.
 */
export const recordFailedCall = async (apiId: string): Promise<void> => {
  try {
    const analytics = await prisma.apiAnalytics.findUnique({
      where: { apiId }
    });

    if (analytics) {
      // Update existing analytics record
      const { successCalls, failedCalls } = analytics;
      await prisma.apiAnalytics.update({
        where: { apiId },
        data: {
          totalCalls: { increment: 1 },
          failedCalls: { increment: 1 },
          errorRate: calculateErrorRate(successCalls, failedCalls + 1), // Increment failedCalls before calculating
          lastUpdated: new Date()
        }
      });
    } else {
      // Create new analytics record
      await prisma.apiAnalytics.create({
        data: {
          apiId,
          totalCalls: 1,
          successCalls: 0,
          failedCalls: 1,
          errorRate: 100, // 100% error rate for first failure
          responseTimeAvg: 0
        }
      });
    }
  } catch (error) {
    logger.error("Error recording failed API call:", error);
  }
};

/**
 * Get analytics for an API
 */
export const getApiAnalytics = async (apiId: string) => {
  try {
    return await prisma.apiAnalytics.findUnique({
      where: { apiId }
    });
  } catch (error) {
    logger.error("Error fetching API analytics:", error);
    return null;
  }
};
/**
 * Get analytics for all APIs owned by a user
 */
export const getUserApiAnalytics = async (userId: string) => {
  try {
    const userApis = await prisma.api.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    const apiIds = userApis.map(api => api.id);
    return await prisma.apiAnalytics.findMany({
      where: {
        apiId: { in: apiIds }
      },
      include: {
        api: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  } catch (error) {
    logger.error("Error fetching user API analytics:", error);
    return [];
  }
};

