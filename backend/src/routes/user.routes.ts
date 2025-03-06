// src/routes/user.routes.ts
import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import userController from "../controllers/user/userController";
const router = Router();
// All routes require authentication
router.use(checkJwt);
router.get("/me", userController.getMyProfile);
router.patch("/me", userController.updateUserProfile);
router.patch("/me/profile", userController.updateProfile);
router.get("/me/notifications", userController.getMyNotifications);
router.post("/me/notifications/read", userController.markNotificationsAsRead);
export default router;

