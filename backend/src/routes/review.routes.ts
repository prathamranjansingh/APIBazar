// src/routes/review.routes.ts
import { Router } from "express";
import { checkJwt } from "../middlewares/auth";
import reviewController from "../controllers/review/reviewController";
const router = Router();
// Public routes
router.get("/apis/:apiId", reviewController.getApiReviews);
// Protected routes
router.use(checkJwt);
router.post("/apis/:apiId", reviewController.createReview);
export default router;

