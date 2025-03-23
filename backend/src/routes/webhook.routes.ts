
import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import webhookController from "../controllers/webhook/webhookController";
const router = Router();
router.use(checkJwt);

router.post("/apis/:apiId/test", webhookController.testWebhooks);
router.post("/apis/:apiId", webhookController.createWebhook);
router.get("/apis/:apiId", webhookController.getApiWebhooks);
router.put("/apis/:apiId/:webhookId", webhookController.updateWebhook);
router.delete("/apis/:apiId/:webhookId", webhookController.deleteWebhook);
router.post("/apis/:apiId/test", webhookController.testWebhooks);
router.get("/apis/:apiId/:webhookId/logs", webhookController.getWebhookDeliveryLogs);
router.post("/apis/:apiId/:webhookId/reset", webhookController.resetWebhookFailures);
export default router;

