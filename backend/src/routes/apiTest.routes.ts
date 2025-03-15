import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import apiTestController from "../controllers/api/apiTestController";
import { apiLimiter } from "../middlewares/rateLimiter";

const router = Router();

// All routes require authentication
router.use(checkJwt);

// Execute a test against an API endpoint
router.post("/:apiId/test", apiLimiter, apiTestController.testEndpoint);

// Execute a test against a specific endpoint
router.post("/:apiId/endpoints/:endpointId/test", apiLimiter, apiTestController.testEndpoint);

// Get sample request for an endpoint
router.get("/:apiId/endpoints/:endpointId/sample", apiTestController.getSampleRequest);

// Generate cURL command for a request
router.post("/generate-curl", apiTestController.generateCurl);

export default router;