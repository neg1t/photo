import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await getServerAuthSession();

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      profile: true,
      collections: {
        include: {
          photos: true,
        },
        orderBy: { createdAt: "desc" },
      },
      portfolioAssets: {
        orderBy: { sortOrder: "asc" },
      },
      services: {
        orderBy: { sortOrder: "asc" },
      },
      plans: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
