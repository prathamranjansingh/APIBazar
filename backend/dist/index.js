"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var dotenv_1 = __importDefault(require("dotenv"));
// import { PrismaClient } from '@prisma/client';
// import authRoutes from './routes/authRoutes';
var errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
dotenv_1.default.config();
var app = (0, express_1.default)();
// const prisma = new PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.use('/auth', authRoutes);
app.use(errorHandler_1.default);
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
