import express from "express";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";
import { Accounts } from "razorpay/dist/types/accounts";
const router = express.Router();

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

router.post("/onboard", async (req: any, res: any) => {
  try {
    const { userId, name, email, contact, businessType } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const payload: Accounts.RazorpayAccountCreateRequestBody = {
      email,
      phone: contact,
      type: "standard",
      legal_business_name: name,
      business_type: businessType || "individual",
      customer_facing_business_name: name,
      contact_name: name,
      profile: {
        business_model: "Online Services",
        category: "others",
        subcategory: "others",
      },
    };

    const account = await razorpay.accounts.create(payload);

    await prisma.user.update({
      where: { id: userId },
      data: {
        razorpayAccountId: account.id,
        onboardingStatus: "pending",
      },
    });

    return res.json({ success: true, razorpayAccountId: account.id });
  } catch (err) {
    console.error("Onboarding error:", err);
    return res.status(500).json({ error: "Failed to onboard seller" });
  }
});

export default router;
