import express, { Request, Response } from "express";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

router.post("/onboard", async (req: any, res: any) => {
  try {
    const {
      userId,
      email,
      phone,
      legalBusinessName,
      businessType,
      contactName,
      referenceId,
      customerFacingBusinessName,
      profile,
      legalInfo,
      contactInfo,
      apps,
    } = req.body;

    if (
      !userId ||
      !email ||
      !phone ||
      !legalBusinessName ||
      !businessType ||
      !contactName
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: userId, email, phone, legalBusinessName, businessType, contactName",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (existingUser.razorpayAccountId) {
      return res.status(409).json({
        error: "User already has a Razorpay account",
        razorpayAccountId: existingUser.razorpayAccountId,
      });
    }

    const accountPayload: any = {
      email,
      phone: parseInt(phone),
      type: "route",
      legal_business_name: legalBusinessName,
      business_type: businessType,
      contact_name: contactName,
      ...(referenceId && { reference_id: referenceId }),
      ...(customerFacingBusinessName && {
        customer_facing_business_name: customerFacingBusinessName,
      }),
    };

    if (profile) {
      accountPayload.profile = {
        category: profile.category,
        subcategory: profile.subcategory,
        ...(profile.businessModel && {
          business_model: profile.businessModel,
        }),
        ...(profile.addresses && { addresses: profile.addresses }),
      };
    }

    if (legalInfo) {
      accountPayload.legal_info = {};
      if (legalInfo.pan) accountPayload.legal_info.pan = legalInfo.pan;
      if (legalInfo.gst) accountPayload.legal_info.gst = legalInfo.gst;
    }

    if (contactInfo) {
      accountPayload.contact_info = contactInfo;
    }

    if (apps) {
      accountPayload.apps = apps;
    }

    const account = await razorpay.accounts.create(accountPayload);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        razorpayAccountId: account.id,
        onboardingStatus: "created",
        updatedAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Seller onboarded successfully",
      data: {
        razorpayAccountId: account.id,
        accountStatus: account.status,
        accountType: account.type,
        referenceId: account.reference_id,
        onboardingStatus: updatedUser.onboardingStatus,
      },
    });
  } catch (error: any) {
    console.error("Razorpay onboarding error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: "Razorpay API error",
        message: error.error?.description || error.message,
        code: error.error?.code,
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Database constraint violation",
        message: "User with this data already exists",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to onboard seller. Please try again.",
    });
  }
});

export default router;
