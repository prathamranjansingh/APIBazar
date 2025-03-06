import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { reviewSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
import { createNotification } from "../../services/notificationService";
import { triggerWebhooks } from "../../services/webhookService";

const prisma = new PrismaClient();

/**
 * Create a review for an API
 */
export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId } = req.params;

  try {
    // Validate review data
    const validated = reviewSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { auth0Id: req.auth.sub },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Check if user has purchased this API
    const hasPurchased = await prisma.purchasedAPI.findUnique({
      where: {
        userId_apiId: {
          userId: user.id,
          apiId,
        },
      },
    });

    if (!hasPurchased && api.ownerId !== user.id) {
      res.status(403).json({ error: "You must purchase this API before reviewing it" });
      return;
    }

    // Check if user already reviewed this API
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_apiId: {
          userId: user.id,
          apiId,
        },
      },
    });

    if (existingReview) {
      res.status(400).json({ error: "You have already reviewed this API" });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        apiId,
        rating: validated.data.rating,
        comment: validated.data.comment,
        authorId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
      },
    });

    // Notify API owner
    if (api.ownerId !== user.id) {
      await createNotification({
        userId: api.ownerId,
        type: "NEW_REVIEW",
        title: "New Review Received",
        message: `Your API "${api.name}" received a ${review.rating}-star review.`,
        data: { apiId, reviewId: review.id },
      });
    }

    // Trigger webhooks
    await triggerWebhooks({
      apiId,
      event: "NEW_REVIEW",
      payload: { review },
    });

    res.status(201).json(review);
  } catch (error) {
    logger.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

/**
 * Get reviews for an API
 */
export const getApiReviews = async (req: Request, res: Response): Promise<void> => {
  const { apiId } = req.params;

  try {
    // Check if API exists
    const api = await prisma.api.findUnique({
      where: { id: apiId },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    // Parse query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { apiId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              picture: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { apiId } }),
    ]);

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      reviews,
      metadata: {
        totalCount,
        averageRating: avgRating,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching API reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export default {
  createReview,
  getApiReviews,
};
