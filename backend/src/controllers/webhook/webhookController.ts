import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../../utils/types";
import { webhookSchema } from "../../utils/validators";
import { logger } from "../../utils/logger";
import { triggerWebhooks } from "../../services/webhookService";

const prisma = new PrismaClient();

export const testWebhooks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId } = req.params;
  const { event, payload } = req.body;

  if (!event) {
    res.status(400).json({ error: "Event type is required" });
    return;
  }

  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if API exists and user owns it
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true, name: true },
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }

    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to test webhooks for this API" });
      return;
    }

    // Prepare test data
    const testData = {
      apiId,
      event,
      payload: payload || {
        test: true,
        message: "This is a test webhook event",
        api: {
          id: apiId,
          name: api.name,
        },
        user: {
          id: user.id,
          name: user.name || user.email,
        },
        timestamp: new Date().toISOString(),
      },
    };

    // Trigger webhooks asynchronously
    triggerWebhooks(testData); // No need to await, just fire and respond
    res.json({ success: true, message: "Test webhooks triggered" });
  } catch (error) {
    logger.error("Error testing webhooks:", error);
    res.status(500).json({ error: "Failed to test webhooks" });
  }
};

/**
 * Get webhook delivery logs
 */
export const getWebhookDeliveryLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { webhookId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if webhook exists and user owns it
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { api: { select: { ownerId: true } } },
    });

    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (webhook.api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to view this webhook" });
      return;
    }

    // Get delivery logs
    const logs = await prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.webhookDelivery.count({ where: { webhookId } });

    res.json({
      logs,
      pagination: {
        total,
        offset,
        limit,
      },
    });
  } catch (error) {
    logger.error("Error fetching webhook logs:", error);
    res.status(500).json({ error: "Failed to fetch webhook logs" });
  }
};

/**
 * Reset webhook failure count
 */
export const resetWebhookFailures = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { webhookId } = req.params;

  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if webhook exists and user owns it
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { api: { select: { ownerId: true } } },
    });

    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (webhook.api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to modify this webhook" });
      return;
    }

    // Reset failure count and reactivate webhook
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        failCount: 0,
        isActive: true,
      },
    });

    res.json({ message: "Webhook failures reset successfully" });
  } catch (error) {
    logger.error("Error resetting webhook failures:", error);
    res.status(500).json({ error: "Failed to reset webhook failures" });
  }
};

/**
 * Create a webhook for an API
 */
export const createWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId } = req.params;

  try {
    // Validate webhook data
    const validated = webhookSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if API exists and user owns it
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to add webhooks to this API" });
      return;
    }

    // Create the webhook
    const webhook = await prisma.webhook.create({
      data: {
        name: validated.data.name,
        url: validated.data.url,
        events: validated.data.events,
        secret: validated.data.secret,
        userId: user.id,
        apiId
      }
    });

    res.status(201).json(webhook);
  } catch (error) {
    logger.error("Error creating webhook:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
};

/**
 * Get webhooks for an API
 */
export const getApiWebhooks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId } = req.params;

  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if API exists and user owns it
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { ownerId: true }
    });

    if (!api) {
      res.status(404).json({ error: "API not found" });
      return;
    }
    if (api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to view webhooks for this API" });
      return;
    }

    // Get webhooks
    const webhooks = await prisma.webhook.findMany({ where: { apiId } });
    res.json(webhooks);
  } catch (error) {
    logger.error("Error fetching webhooks:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
};

/**
 * Update a webhook
 */
export const updateWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId, webhookId } = req.params;

  try {
    // Validate webhook data
    const validated = webhookSchema.partial().safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({ error: validated.error.format() });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if webhook exists and user owns it
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { api: { select: { ownerId: true } } }
    });

    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }
    if (webhook.api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to update this webhook" });
      return;
    }

    // Update the webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: validated.data
    });

    res.json(updatedWebhook);
  } catch (error) {
    logger.error("Error updating webhook:", error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.auth?.sub) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { apiId, webhookId } = req.params;

  try {
    // Get user
    const user = await prisma.user.findUnique({ where: { auth0Id: req.auth.sub } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if webhook exists and user owns it
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
      include: { api: { select: { ownerId: true } } }
    });

    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }
    if (webhook.api.ownerId !== user.id) {
      res.status(403).json({ error: "You don't have permission to delete this webhook" });
      return;
    }

    // Delete the webhook
    await prisma.webhook.delete({ where: { id: webhookId } });
    res.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    logger.error("Error deleting webhook:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
};

export default {
  createWebhook,
  getApiWebhooks,
  updateWebhook,
  deleteWebhook,
  testWebhooks,
  getWebhookDeliveryLogs,
  resetWebhookFailures,
};
