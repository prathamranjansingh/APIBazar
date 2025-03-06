import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { WebhookData } from "../utils/types";
import { logger } from "../utils/logger";
import { signWebhookPayload } from "../utils/helpers";

const prisma = new PrismaClient();

/**
 * Trigger webhooks for a specific event.
 * Finds active webhooks subscribed to the event and sends payloads.
 */
export const triggerWebhooks = async (data: WebhookData): Promise<void> => {
  try {
    // Find all active webhooks for this API that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        apiId: data.apiId,
        isActive: true,
        events: {
          has: data.event
        }
      }
    });

    if (webhooks.length === 0) {
      return; // No webhooks to trigger
    }

    // Add timestamp and event type to payload
    const enrichedPayload = {
      ...data.payload,
      timestamp: new Date().toISOString(),
      event: data.event
    };

    // Send webhook requests in parallel
    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          // Add signature if secret exists
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "APIBazar-Webhook",
            "X-Webhook-Event": data.event
          };

          if (webhook.secret) {
            const signature = signWebhookPayload(enrichedPayload, webhook.secret);
            headers["X-Webhook-Signature"] = signature;
          }

          // Send the webhook
          const response = await axios.post(webhook.url, enrichedPayload, {
            headers,
            timeout: 10000 // 10s timeout
          });

          // Update webhook status on success
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastTriggered: new Date(),
              lastStatus: response.status,
              failCount: 0 // Reset fail count on success
            }
          });

          logger.info(`Webhook ${webhook.id} triggered successfully for event ${data.event}`);
        } catch (error: any) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastTriggered: new Date(),
              lastStatus: error.response?.status || 0,
              failCount: {
                increment: 1
              }
            }
          });

          logger.error(`Webhook ${webhook.id} delivery failed:`, error.message);

          // If webhook has failed too many times, deactivate it
          if (webhook.failCount >= 9) { // This will be 10 after the increment
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                isActive: false
              }
            });

            // Notify the webhook owner
            const notification = {
              userId: webhook.userId,
              type: "SYSTEM" as const,
              title: "Webhook Deactivated",
              message: `Your webhook "${webhook.name}" has been automatically deactivated due to repeated delivery failures.`,
              data: { webhookId: webhook.id }
            };

            // Import dynamically to avoid circular dependency
            const { createNotification } = require("./notificationService");
            await createNotification(notification);

            logger.warn(`Webhook ${webhook.id} automatically deactivated after repeated failures`);
          }
        }
      })
    );
  } catch (error) {
    logger.error("Error triggering webhooks:", error);
  }
};
