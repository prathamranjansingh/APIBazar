import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import { ReactElement } from "react";
import { CreateEmailOptions } from "resend";

export async function sendViaNodeMailer({
  to,
  subject,
  text,
  react,
}: Pick<CreateEmailOptions, "subject" | "text" | "react"> & {
  to: string;
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    secure: false,
    tls: { rejectUnauthorized: false },
  });

  const html = react ? await render(react) : undefined;

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}
