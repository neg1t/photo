import { z } from "zod";

import { createUniqueUsername, slugifyUsernameSegment } from "@/lib/core/username";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const profileSchema = z.object({
  firstName: z.string().trim().max(80).default(""),
  lastName: z.string().trim().max(80).default(""),
  username: z.string().trim().max(80).default(""),
  telegramUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https:\/\/t\.me\/.+/i.test(value), {
      message: "Укажите ссылку на Telegram в формате https://t.me/username",
    })
    .default(""),
});

async function isUsernameTaken(candidate: string, profileId: string) {
  const existing = await prisma.photographerProfile.findUnique({
    where: { username: candidate },
    select: { id: true },
  });

  return Boolean(existing && existing.id !== profileId);
}

async function ensureAvailableUsername(base: string, profileId: string) {
  const normalizedBase = slugifyUsernameSegment(base) || "photographer";

  if (!(await isUsernameTaken(normalizedBase, profileId))) {
    return normalizedBase;
  }

  let suffix = 2;

  while (await isUsernameTaken(`${normalizedBase}-${suffix}`, profileId)) {
    suffix += 1;
  }

  return `${normalizedBase}-${suffix}`;
}

export async function updateProfileForUser(
  userId: string,
  input: z.input<typeof profileSchema>,
) {
  const parsed = profileSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user?.profile) {
    throw new AppError("Профиль фотографа не найден.", 404);
  }

  const requestedUsername =
    parsed.username ||
    (await createUniqueUsername(
      {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: user.email,
      },
      async (candidate) => isUsernameTaken(candidate, user.profile!.id),
    ));
  const username = await ensureAvailableUsername(
    requestedUsername,
    user.profile.id,
  );

  return prisma.photographerProfile.update({
    where: { id: user.profile.id },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      username,
      telegramUrl: parsed.telegramUrl || null,
    },
  });
}

export async function getPublicProfileByUsername(username: string) {
  return prisma.photographerProfile.findUnique({
    where: { username },
    include: {
      user: {
        include: {
          portfolioAssets: {
            orderBy: { sortOrder: "asc" },
          },
          services: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}
