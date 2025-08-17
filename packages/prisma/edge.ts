import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

dotenv.config();
neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.NEON_DATABASE_URL}`;

const adapter = new PrismaNeon({ connectionString });
export const prismaEdge =
  global.prisma ||
  new PrismaClient({
    adapter,
  });
