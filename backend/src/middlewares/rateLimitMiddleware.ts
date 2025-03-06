import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers["x-api-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "API Key required" });
      return;
    }

    const existingKey = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!existingKey || !existingKey.isActive) {
      res.status(403).json({ error: "Invalid or inactive API key" });
      return;
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const requestCount = await prisma.rateLimitLog.count({
      where: {
        apiKeyId: existingKey.id,
        timestamp: { gte: oneMinuteAgo },
      },
    });

    if (requestCount >= existingKey.rateLimit) {
      res.status(429).json({ error: "Rate limit exceeded" });
      return;
    }

    // Log request
    await prisma.rateLimitLog.create({
      data: {
        apiKeyId: existingKey.id,
        ip: req.ip || "",
        endpoint: req.originalUrl,
      },
    });

    next(); // ✅ Move forward to the next middleware
  } catch (error) {
    console.error("Rate Limit Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
