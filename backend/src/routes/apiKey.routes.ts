import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import apiKeyController from "../controllers/apiKey/apiKeyController";
const router = Router();
// All routes require authentication
router.use(checkJwt);
router.post("/apis/:apiId", apiKeyController.createNewApiKey);
router.get("/me", apiKeyController.getMyApiKeys);
router.delete("/:keyId", apiKeyController.revokeMyApiKey);
export default router;

