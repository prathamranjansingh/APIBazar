import { prisma } from "@apibazar/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiSchema } from "@/lib/zod/schemas/api.schema";

type CreateApiInput = z.infer<typeof apiSchema>;
type UpdateApiInput = Partial<CreateApiInput>;


export const apiWithDetails = Prisma.validator<Prisma.ApiDefaultArgs>()({
  include: {
    owner: { select: { id: true, name: true, image: true } },
    endpoints: { select: { id: true, name: true, method: true, path: true } },
    _count: { select: { reviews: true, purchasedBy: true } },
    purchasedBy: { select: { userId: true } },
  },
});
export type ApiWithDetails = Prisma.ApiGetPayload<typeof apiWithDetails>;


export const apiRepository = {
  async findById(id: string): Promise<ApiWithDetails | null> {
    return prisma.api.findUnique({
      where: { id },
      ...apiWithDetails,
    });
  },

  async findManyWithFilters(
    filters: { category?: string; search?: string },
    pagination: { page: number; limit: number }
  ) {
    const where: Prisma.ApiWhereInput = {};
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [apis, totalCount] = await prisma.$transaction([
      prisma.api.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
        ...apiWithDetails,
      }),
      prisma.api.count({ where }),
    ]);

    return { data: apis, total: totalCount };
  },

  async findByOwnerId(ownerId: string): Promise<ApiWithDetails[]> {
    return prisma.api.findMany({
      where: { ownerId },
      ...apiWithDetails,
    });
  },

  async create(data: CreateApiInput, ownerId: string): Promise<ApiWithDetails> {
    const { baseURL, documentation, ...rest } = data;
    return prisma.api.create({
      data: {
        ...rest,
        baseUrl: baseURL,
        documentation: documentation ?? "",
        price: data.pricingModel === "FREE" ? null : data.price,
        ownerId,
        analytics: {
          create: {},
        },
      },
      ...apiWithDetails,
    });
  },

  async update(id: string, data: UpdateApiInput): Promise<ApiWithDetails> {
    const updateData: any = { ...data };

    if (data.pricingModel === 'FREE') {
      updateData.price = null;
    }

    if (updateData.baseURL !== undefined) {
      updateData.baseUrl = updateData.baseURL;
      delete updateData.baseURL;
    }

    return prisma.api.update({
      where: { id },
      data: updateData,
      ...apiWithDetails,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.api.delete({
      where: { id },
    });
  },
};