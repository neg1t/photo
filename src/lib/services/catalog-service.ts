import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const createServiceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  price: z.string().trim().min(1),
  priceType: z.enum(["PER_SERVICE", "PER_HOUR"]),
});

export async function createPhotographerService(
  userId: string,
  input: z.input<typeof createServiceSchema>,
) {
  const parsed = createServiceSchema.parse(input);
  const currentCount = await prisma.service.count({
    where: { userId },
  });

  return prisma.service.create({
    data: {
      userId,
      title: parsed.title,
      price: new Prisma.Decimal(parsed.price.replace(",", ".")),
      priceType: parsed.priceType,
      sortOrder: currentCount,
    },
  });
}

export async function deletePhotographerService(userId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      userId,
    },
  });

  if (!service) {
    throw new AppError("Услуга не найдена.", 404);
  }

  await prisma.service.delete({
    where: { id: serviceId },
  });
}
