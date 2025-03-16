import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import apiProxyController from "../controllers/api/apiProxyController";

const router = Router();

// Public routes (no authentication required)
router.post("/public-test/:apiId", apiProxyController.testPublicEndpoint);
router.post("/public-test/:apiId/:endpointId", apiProxyController.testPublicEndpoint);

// Routes below this require authentication
router.use(checkJwt);

router.all("/:apiId/*", (req, res, next) => {
  const endpointPath = req.params[0];
  req.params.endpointPath = endpointPath;
  next();
}, apiProxyController.proxyApiRequest);

router.get("/:apiId/sdk/:language", apiProxyController.generateSdkCode);

export default router;