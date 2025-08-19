import { prisma } from "@apibazar/prisma";
import { z } from "zod";
import { endpointSchema } from "@/lib/zod/schemas/endpoint.schema";

type CreateEndpointInput = z.infer<typeof endpointSchema>;
type UpdateEndpointInput = Partial<CreateEndpointInput>;

export const endpointRepository = {
  async findById(id: string) {
    return prisma.endpoint.findUnique({ where: { id } });
  },
  async findByPathAndMethod(apiId: string, path: string, method: any) {
    return prisma.endpoint.findFirst({ where: { apiId, path, method } });
  },
  async create(data: CreateEndpointInput, apiId: string) {
    return prisma.endpoint.create({ data: { ...data, apiId } });
  },
  async update(id: string, data: UpdateEndpointInput) {
    return prisma.endpoint.update({ where: { id }, data });
  },
  async delete(id: string) {
    return prisma.endpoint.delete({ where: { id } });
  },
};