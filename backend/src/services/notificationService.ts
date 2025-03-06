import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

export const sendNotification = async (userId: string, type: NotificationType, payload: any) => {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
    },
  });
};
