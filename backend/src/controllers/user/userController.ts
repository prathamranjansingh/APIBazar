import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { profileSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
const prisma = new PrismaClient();
/**
 * Create or update user profile from Auth0
 */
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const auth0Id = req.auth.sub;
    const { email, name, picture } = req.body;
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { auth0Id },
      include: { profile: true }
    });
    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { auth0Id },
        data: {
          email: email || user.email,
          name: name || user.name,
          picture: picture || user.picture,
        },
        include: { profile: true }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          auth0Id,
          email: email || "",
          name: name,
          picture: picture,
          profile: {
            create: {} // Create empty profile
          }
        },
        include: { profile: true }
      });
    }
    res.json(user);
  } catch (error) {
    logger.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};
/**
 * Update user's extended profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    // Validate profile data
    const validated = profileSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
      include: { profile: true }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Update or create profile
    let profile;
    if (user.profile) {
      profile = await prisma.profile.update({
        where: { userId: user.id },
        data: validated.data
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          ...validated.data,
          userId: user.id
        }
      });
    }
    res.json(profile);
  } catch (error) {
    logger.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
/**
 * Get current user's profile
 */
export const getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
      include: {
        profile: true,
        _count: {
          select: {
            listedAPIs: true,
            purchasedAPIs: true,
            reviews: true
          }
        }
      }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * Check if the current user has purchased an API
 */
export const checkApiPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if the user is authenticated
    if (!req.auth?.sub) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { apiId } = req.params;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if the API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      res.status(404).json({ error: 'API not found' });
      return;
    }

    // If the user is the API owner, they have automatic access
    if (api.ownerId === user.id) {
      res.json({ purchased: true, owner: true });
      return;
    }

    // Otherwise, check if the user has purchased the API
    const purchase = await prisma.purchasedAPI.findUnique({
      where: {
        userId_apiId: {
          userId: user.id,
          apiId: apiId,
        },
      },
    });

    res.json({
      purchased: !!purchase,
      owner: false,
      purchasedAt: purchase?.createdAt || null, // Using `createdAt` as a substitute for `purchasedAt`
    });
  } catch (error) {
    logger.error('Error checking API purchase status:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
};

/**
 * Get user's notifications
 */
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Parse query params
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit as string) || 20;
    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {        userId: user.id,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    // Get count of unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "Notification IDs are required" });
      return;
    }
    // Update notifications
    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: user.id // Ensure user owns these notifications
      },
      data: {
        isRead: true
      }
    });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};
export default {
  updateUserProfile,
  updateProfile,
  getMyProfile,
  getMyNotifications,
  markNotificationsAsRead,
  checkApiPurchase
};




