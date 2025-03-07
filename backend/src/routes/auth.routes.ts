
import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import authController from "../controllers/auth/authController";
const router = Router();
// Auth0 callback - no authentication required as it's called from Auth0
router.post("/callback", authController.handleAuth0Callback);
// Get current user - requires authentication
router.get("/me", checkJwt, authController.getCurrentUser);
export default router;

