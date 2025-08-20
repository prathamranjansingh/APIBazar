import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateRawKey() {
  return crypto.randomBytes(24).toString("base64url"); // ~32 chars, URL-safe
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const USER_ID = process.env.APIBAZAR_USER_ID; // set this to the user’s id (or hardcode it)

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL first.");
  process.exit(1);
}
if (!USER_ID) {
  console.error("Set APIBAZAR_USER_ID to the target user id.");
  process.exit(1);
}

const rawKey = generateRawKey();
const hashedKey = sha256Hex(rawKey);
const partialKey = rawKey.slice(-8);

const tokenName = "Postman Key";

const token = await prisma.token.create({
  data: {
    name: tokenName,
    hashedKey,
    partialKey,
    userId: USER_ID,
  },
});

console.log("Raw API key (save this):", rawKey);
console.log("Token record created:", token);
await prisma.$disconnect();