// src/services/notificationService.ts
import { PrismaClient } from "@prisma/client";
import { NotificationData } from "../utils/types";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Create a new notification for a user.
 * Stores notification details like type, title, message, and extra data.
 */
export const createNotification = async (data: NotificationData): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {} // Optional additional data
      }
    });
    logger.debug(`Notification created for user ${data.userId}: ${data.title}`);
  } catch (error) {
    logger.error("Error creating notification:", error);
  }
};

/**
 * Mark specific notifications as read for a user.
 * Accepts an array of notification IDs to update.
 */
export const markNotificationsAsRead = async (userId: string, notificationIds: string[]): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        id: { in: notificationIds }
      },
      data: {
        isRead: true
      }
    });
    logger.debug(`Marked ${notificationIds.length} notifications as read for user ${userId}`);
  } catch (error) {
    logger.error("Error marking notifications as read:", error);
  }
};

/**
 * Retrieve user notifications.
 * Optionally fetches only unread notifications.
 */
export const getUserNotifications = async (userId: string, unreadOnly: boolean = false) => {
  try {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc" // Newest first
      }
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return [];
  }
};
