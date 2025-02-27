import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findOrCreateUser = async (userData: { auth0Id: string; email: string; name: string; picture?: string }) => {
  let user = await prisma.user.findUnique({ where: { auth0Id: userData.auth0Id } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        auth0Id: userData.auth0Id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture || null,
      },
    });
  }

  return user;
};

export const findUserByAuth0Id = async (auth0Id: string) => {
  return prisma.user.findUnique({ where: { auth0Id } });
};
