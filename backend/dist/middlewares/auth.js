"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
var express_jwt_1 = require("express-jwt");
var jwks_rsa_1 = __importDefault(require("jwks-rsa"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.authMiddleware = (0, express_jwt_1.expressjwt)({
    secret: jwks_rsa_1.default.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: "https://".concat(process.env.AUTH0_DOMAIN, "/.well-known/jwks.json"),
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: "https://".concat(process.env.AUTH0_DOMAIN, "/"),
    algorithms: ["RS256"],
});
