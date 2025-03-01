import express from "express";
import { getAllApis, createApi, getApiById } from "../controllers/api/apiController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

router.get("/", getAllApis);
router.get("/:id", getApiById);
router.post("/createApi", authMiddleware, createApi);


export default router;
