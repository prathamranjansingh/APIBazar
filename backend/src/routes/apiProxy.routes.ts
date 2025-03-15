import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import apiProxyController from "../controllers/api/apiProxyController";

const router = Router();

// All routes require authentication
router.use(checkJwt);

// Proxy API requests
router.all("/:apiId/*", (req, res, next) => {
  const endpointPath = req.params[0];
  req.params.endpointPath = endpointPath;
  next();
}, apiProxyController.proxyApiRequest);

router.get(
    '/sdk/:apiId/:language',
    checkJwt,
    apiProxyController.generateSdkCode
  );
// Generate SDK code in different languages
router.get("/:apiId/sdk/:language", apiProxyController.generateSdkCode);


export default router;