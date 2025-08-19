import { prisma } from "@apibazar/prisma";

export const purchasedApiRepository = {
  async findByUserId(userId: string) {
    const purchases = await prisma.purchasedAPI.findMany({
      where: { userId },
      include: {
        api: {
          include: {
            owner: { select: { id: true, name: true } },
            endpoints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return purchases.map(p => p.api);
  },
};