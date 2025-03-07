import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { profileSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
const prisma = new PrismaClient();
/**
 * Auth0 callback handler - creates or updates user from Auth0 profile
 */
export const handleAuth0Callback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract user data from Auth0
    const { sub, email, name, picture } = req.body;
    if (!sub || !email) {
      res.status(400).json({ error: "Invalid user data" });
      return;
    }
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { auth0Id: sub },
      include: { profile: true }
    });
    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { auth0Id: sub },
        data: {
          email,
          name: name || user.name,
          picture: picture || user.picture,
          updatedAt: new Date()
        },
        include: { profile: true }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          auth0Id: sub,
          email,
          name: name || email.split('@')[0], // Use part of email as name if not provided
          picture,
          profile: {
            create: {} // Create empty profile
          }
        },
        include: { profile: true }
      });
logger.info(`New user created: ${user.id} (${email})`);
    }
    res.status(200).json({ message: "User synchronized", user });
  } catch (error) {
    logger.error("Error handling Auth0 callback:", error);
    res.status(500).json({ error: "Failed to synchronize user" });
  }
};
/**
 * Get current authenticated user with profile
 */
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            notifications: {
              where: { isRead: false }
            }
          }
        }
      }
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Don't send sensitive information
    const { auth0Id, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    logger.error("Error fetching current user:", error);

    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
export default {
  handleAuth0Callback,
  getCurrentUser
};

