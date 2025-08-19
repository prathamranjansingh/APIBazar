import { prisma } from "@apibazar/prisma";

export const transactionRepository = {
    async findExisting(buyerId: string, apiId: string) {
        return prisma.transaction.findFirst({
            where: { buyerId, apiId, status: "completed" },
        });
    },
    // Add more transaction-related functions as needed
};