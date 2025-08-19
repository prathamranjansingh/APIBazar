import { prisma } from "@apibazar/prisma";

export const userRepository = {
    async findById(id: string) {
        return prisma.user.findUnique({ where: { id } });
    },
};