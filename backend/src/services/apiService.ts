import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllApis = async () => {
  return await prisma.api.findMany({ include: { endpoints: true } });
};

export const createApi = async (ownerId: string, data: any) => {
  const { pricingModel, price, ...rest } = data;

  if (pricingModel === "PAID" && (price === null || price === undefined)) {
    throw new Error("Price is required for PAID models.");
  }

  return await prisma.api.create({
    data: {
      ...rest,
      pricingModel,
      price: pricingModel === "FREE" ? null : price,
      ownerId,
      documentation: data.documentation ?? "",
    },
  });
};

export const getApiById = async (id: string) => {
  return await prisma.api.findUnique({ where: { id }, include: { endpoints: true } });
};
