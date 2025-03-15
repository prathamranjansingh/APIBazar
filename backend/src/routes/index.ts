import { Router } from "express";
import apiRoutes from "./api.routes";
import userRoutes from "./user.routes";
import webhookRoutes from "./webhook.routes";
import apiKeyRoutes from "./apiKey.routes";
import reviewRoutes from "./review.routes";
import authRoutes from "./auth.routes";
import apiTestRoutes from "./apiTest.routes";
import apiProxyRoutes from "./apiProxy.routes";

const router = Router();
router.use("/apis", apiRoutes);
router.use("/users", userRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/keys", apiKeyRoutes);
router.use("/reviews", reviewRoutes);
router.use("/auth", authRoutes);
router.use("/api-test", apiTestRoutes);
router.use("/api-proxy", apiProxyRoutes);
export default router;

