
import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import webhookController from "../controllers/webhook/webhookController";
const router = Router();
// All routes require authentication
router.use(checkJwt);
router.post("/apis/:apiId", webhookController.createWebhook);
router.get("/apis/:apiId", webhookController.getApiWebhooks);
router.put("/apis/:apiId/:webhookId", webhookController.updateWebhook);
router.delete("/apis/:apiId/:webhookId", webhookController.deleteWebhook);
export default router;

