"use server";

import { prisma } from "@apibazar/prisma";
import { ratelimit, redis } from "@/lib/upstash";
import { flattenValidationErrors } from "next-safe-action";
import { sendEmail } from "@apibazar/email";
import { VerifyEmail } from "@apibazar/email/templates/verify-email";
import { generateOTP } from "@/lib/auth";
import { EMAIL_OTP_EXPIRY_IN } from "@/lib/auth/constants";
import { getIP } from "@/lib/api/utils";
import { throwIfAuthenticated } from "@/lib/actions/auth/throw-if-authenticated";
import z from "zod";
import { emailSchema, passwordSchema } from "./zod/schemas/auth";
import { actionClient } from "./actions/safe-action";
import { get } from "@vercel/edge-config";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

/* ------------------------------------------------------------------ */
/* 2. Action                                                           */
/* ------------------------------------------------------------------ */
export const sendOtpAction = actionClient
  .schema(schema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;

    /* rate-limit — 2 requests per minute / IP */
    const { success } = await ratelimit(2, "1 m").limit(
      `send-otp:${await getIP()}`
    );
    if (!success) throw new Error("Too many requests. Try again later.");

    /* disallow gmail+alias */
    if (email.includes("+") && email.endsWith("@gmail.com"))
      throw new Error("Please remove the “+” alias from your Gmail address.");

    /* disposable / black-listed domains (optional) ------------------- */
    const domain = email.split("@")[1] ?? "";
    if (process.env.NEXT_PUBLIC_IS_DUB) {
      const [isDisposable, emailDomainTerms] = await Promise.all([
        redis.sismember("disposableEmailDomains", domain),
        process.env.EDGE_CONFIG ? get("emailDomainTerms") : [],
      ]);

      if (isDisposable)
        throw new Error("Disposable addresses are not allowed.");

      if (emailDomainTerms && Array.isArray(emailDomainTerms)) {
        const regex = new RegExp(
          emailDomainTerms
            .map((t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|")
        );
        if (regex.test(domain))
          throw new Error("E-mail domain not accepted for sign-ups.");
      }
    }

    /* user must not already exist ------------------------------------ */
    if (await prisma.user.findUnique({ where: { email } }))
      throw new Error("Account already exists – log in instead.");

    /* generate & store OTP ------------------------------------------ */
    const code = generateOTP();
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({
        where: { identifier: email },
      }),
      prisma.emailVerificationToken.create({
        data: {
          identifier: email,
          token: code,
          expires: new Date(Date.now() + EMAIL_OTP_EXPIRY_IN * 1000),
        },
      }),
    ]);
    console.log("Sending OTP email to:", email);
    await sendEmail({
      subject: `${process.env.NEXT_PUBLIC_APP_NAME}: verify your account`,
      email,
      react: VerifyEmail({ email, code }),
    });
  });
