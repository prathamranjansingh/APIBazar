import { Resend } from "resend";
import { ReactElement } from "react";
import { ResendEmailOptions } from "./resend/types";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendViaResend(opts: ResendEmailOptions) {
  const { email, from, bcc, replyTo, subject, text, react, scheduledAt } = opts;

  if (!resend) {
    console.info("RESEND_API_KEY not set, skipping Resend.");
    return;
  }

  if (!process.env.SMTP_FROM) {
    throw new Error("Missing SMTP_FROM in environment variables");
  }

  return resend.emails.send({
    to: email,
    from: from || process.env.SMTP_FROM,
    bcc: bcc,
    replyTo: replyTo,
    subject,
    text,
    react,
    scheduledAt,
  });
}
