import { sendViaResend } from "./send-via-resend";
import { sendViaNodeMailer } from "./send-via-nodemailer";
import { ResendEmailOptions } from "./resend/types";

export async function sendEmail(opts: ResendEmailOptions) {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(opts);
  }

  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);

  if (smtpReady) {
    const { email, subject, text, react } = opts;
    return sendViaNodeMailer({ to: email, subject, text, react });
  }

  console.info(
    "Email not sent – neither RESEND_API_KEY nor SMTP_* env vars are configured."
  );
}
