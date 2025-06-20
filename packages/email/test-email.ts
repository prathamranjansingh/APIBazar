import "dotenv/config";
import { sendViaNodeMailer } from "./src/send-via-nodemailer";

async function testEmail() {
  try {
    console.log(process.env.SMTP_HOST, process.env.SMTP_PORT);

    await sendViaNodeMailer({
      to: "dase.std@gmail.com", // ✅ Replace with your own email
      subject: "Test Email from NodeMailer",
      text: "Hello! This is a test email sent using NodeMailer + Gmail in TypeScript.",
    });
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}

testEmail();
