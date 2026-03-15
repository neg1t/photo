import type { AccessStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

function assertAdmin(email: string) {
  if (!env.auth.adminEmails.includes(email.toLowerCase())) {
    throw new AppError("Недостаточно прав для управления доступом.", 403);
  }
}

export async function updateUserAccessStatus(input: {
  adminEmail: string;
  userId: string;
  accessStatus: AccessStatus;
}) {
  assertAdmin(input.adminEmail);

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      accessStatus: input.accessStatus,
    },
  });
}
