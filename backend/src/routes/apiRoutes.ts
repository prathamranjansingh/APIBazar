import express from "express";
import * as apiController from "../controllers/api/apiController";
import { authMiddleware } from "../middlewares/auth";
import { rateLimitMiddleware } from "../middlewares/rateLimitMiddleware";

const router = express.Router();

router.get("/", apiController.getAllApis);
router.post("/", authMiddleware, rateLimitMiddleware, apiController.createApi);
router.get("/:id", apiController.getApiById);

export default router;
