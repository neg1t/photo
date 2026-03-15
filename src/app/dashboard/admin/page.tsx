import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AdminUser = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await requireCurrentUser();

  if (!env.auth.adminEmails.includes(user.email.toLowerCase())) {
    notFound();
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;
  const users: AdminUser[] = await prisma.user.findMany({
    include: {
      profile: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Internal Admin</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Ручное управление доступом
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          До подключения billing доступом фотографов управляет владелец через
          эту internal-страницу.
        </p>
      </Card>

      <div className="grid gap-4">
        {users.map((targetUser: AdminUser) => (
          <Card
            key={targetUser.id}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold">
                {targetUser.profile?.firstName || "Без имени"}{" "}
                {targetUser.profile?.lastName}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {targetUser.email} • @{targetUser.profile?.username}
              </p>
            </div>

            <form
              action="/dashboard/admin/access"
              method="post"
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="userId" value={targetUser.id} />
              <select
                name="accessStatus"
                defaultValue={targetUser.accessStatus}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <Button type="submit" variant="secondary">
                Обновить статус
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
