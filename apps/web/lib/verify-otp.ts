"use server";

import { prisma } from "@apibazar/prisma";
import { ratelimit } from "@/lib/upstash";
import { flattenValidationErrors } from "next-safe-action";
import { getIP } from "@/lib/api/utils";
import { throwIfAuthenticated } from "./actions/auth/throw-if-authenticated";
import { actionClient } from "./actions/safe-action";
import { hashPassword } from "./auth/password";
import { emailSchema, passwordSchema } from "./zod/schemas/auth";
import z from "zod";

const schema = z.object({
  email: emailSchema,
  code: z.string().length(6, "OTP should be 6 digits"),
  password: passwordSchema,
});

export const verifyOtpAction = actionClient
  .schema(schema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    console.log("⏩ verifyOtpAction", parsedInput);

    const { email, code, password } = parsedInput;

    const { success } = await ratelimit(5, "1 m").limit(
      `verify-otp:${await getIP()}`
    );
    if (!success) {
      console.warn("🚫 Rate-limit hit");
      return { serverError: "Too many attempts. Try again later." };
    }

    /* ------------------------------------------------------------------ */
    /* 1. load token                                                      */
    /* ------------------------------------------------------------------ */
    const token = await prisma.emailVerificationToken.findFirst({
      where: { identifier: email, token: code },
    });
    console.log("🔍 token", token);

    if (!token) return { serverError: "Invalid OTP." };
    if (token.expires.getTime() < Date.now())
      return { serverError: "OTP expired." };

    /* ------------------------------------------------------------------ */
    /* 2. ensure user doesn't exist                                       */
    /* ------------------------------------------------------------------ */
    if (await prisma.user.findUnique({ where: { email } }))
      return { serverError: "Account already exists." };

    /* ------------------------------------------------------------------ */
    /* 3. create user                                                     */
    /* ------------------------------------------------------------------ */
    try {
      await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          emailVerified: new Date(),
        },
      });
      console.log("✅ user created:", email);
    } catch (e) {
      console.error("🔥 prisma create error", e);
      return { serverError: "Database error: could not create user." };
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { identifier: email },
    });

    return { data: true }; // ✅ success payload
  });
