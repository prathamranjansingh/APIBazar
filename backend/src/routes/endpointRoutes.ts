import express from "express";
import { addEndpoint, getEndpointsByApi, deleteEndpoint } from "../controllers/api/endpointController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();


router.post("/add",authMiddleware, addEndpoint);


router.get("/:apiId", getEndpointsByApi);


router.delete("/:endpointId",authMiddleware, deleteEndpoint);

export default router;
