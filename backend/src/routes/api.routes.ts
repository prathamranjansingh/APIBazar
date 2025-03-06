
// src/routes/api.routes.ts
import { Router } from "express";
import { checkJwt } from "../middlewares/auth"; 
import apiController from "../controllers/api/apiController";
import { globalRateLimiter } from "../middlewares/rateLimiter";
const router = Router();
// Public routes
router.get("/",
  globalRateLimiter({ maxRequests: 100, windowMs: 60 * 1000 }),
  apiController.getAllApis
);
router.get("/:id", apiController.getApiById);
// Protected routes
router.use(checkJwt);
router.post("/", apiController.createApi);
router.get("/user/me", apiController.getMyApis);
router.get("/user/purchased", apiController.getPurchasedApis);
router.put("/:id", apiController.updateApi);
router.delete("/:id", apiController.deleteApi);
// Endpoint routes
router.post("/:apiId/endpoints", apiController.addEndpoint);
router.put("/:apiId/endpoints/:endpointId", apiController.updateEndpoint);
router.delete("/:apiId/endpoints/:endpointId", apiController.deleteEndpoint);
// Purchase route
router.post("/:apiId/purchase", apiController.purchaseApi);
export default router;

