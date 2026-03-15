import Link from "next/link";
import { ArrowRight, Clock3, FolderOpen, Images, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/session";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/dashboard/collections", label: "Новая коллекция", icon: FolderOpen },
  { href: "/dashboard/portfolio", label: "Обновить портфолио", icon: Images },
  { href: "/dashboard/profile", label: "Проверить публичный профиль", icon: Link2 },
];

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const publishedCollections = user.collections.filter(
    (collection) => collection.status === "PUBLISHED",
  );

  return (
    <>
      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,248,241,0.96),rgba(255,236,226,0.82))]">
        <Badge>Dashboard</Badge>
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-semibold tracking-[-0.04em]">
              Весь рабочий контур съемки в одном кабинете.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
              Загружайте новые фотосессии, держите портфолио в актуальном
              состоянии и контролируйте объем хранилища без внешних таблиц и
              ручного трекинга.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-black/8 bg-white/80 p-4 text-sm text-[var(--muted-foreground)] transition hover:translate-y-[-1px] hover:bg-white"
              >
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 font-semibold text-[var(--foreground)]">
                  {item.label}
                </p>
                <ArrowRight className="mt-4 h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Коллекции
          </p>
          <p className="mt-4 text-4xl font-semibold">{user.collections.length}</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Опубликовано: {publishedCollections.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Портфолио
          </p>
          <p className="mt-4 text-4xl font-semibold">
            {user.portfolioAssets.length}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Все работы учитываются в квоте: {formatBytes(user.storageUsedBytes)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Доступ
          </p>
          <p className="mt-4 text-4xl font-semibold">{user.accessStatus}</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Если статус не ACTIVE, загрузка и публикация будут заблокированы.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Последние коллекции
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Что уже готово к отправке клиенту
            </h3>
          </div>
          <Button asChild variant="secondary">
            <Link href="/dashboard/collections">Открыть раздел</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {user.collections.slice(0, 4).map((collection) => (
            <div
              key={collection.id}
              className="flex flex-col gap-4 rounded-[24px] border border-black/8 bg-white/70 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold">{collection.title}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Clock3 className="h-4 w-4" />
                  Хранение до {collection.expiresAt.toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{collection.status}</Badge>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {collection.photos.length} фото
                </p>
              </div>
            </div>
          ))}

          {!user.collections.length ? (
            <p className="rounded-[24px] border border-dashed border-black/10 px-4 py-6 text-sm text-[var(--muted-foreground)]">
              Пока нет ни одной коллекции. Создайте первую в разделе
              «Коллекции».
            </p>
          ) : null}
        </div>
      </Card>
    </>
  );
}
