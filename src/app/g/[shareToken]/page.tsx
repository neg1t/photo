import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaTile } from "@/components/media/media-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCollectionForPublicPage } from "@/lib/services/collections-service";

export const dynamic = "force-dynamic";

type PublicCollectionPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function PublicCollectionPage({
  params,
}: PublicCollectionPageProps) {
  const { shareToken } = await params;
  const payload = await getCollectionForPublicPage(shareToken);

  if (!payload || payload.publicState === "hidden") {
    notFound();
  }

  if (payload.publicState === "expired") {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-8">
        <Card className="max-w-xl">
          <Badge>Коллекция недоступна</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Срок хранения этой коллекции истек
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
            Если вам нужен повторный доступ, свяжитесь с фотографом через его
            публичный профиль.
          </p>
        </Card>
      </main>
    );
  }

  const { collection } = payload;
  const photographer = collection.user.profile;

  return (
    <main className="shell flex min-h-screen flex-col gap-6 py-8">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,251,246,0.96),rgba(242,236,252,0.72))]">
        <Badge>Публичная коллекция</Badge>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              {collection.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
              {collection.photos.length} фото • доступно до{" "}
              {collection.expiresAt.toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <a href={`/api/public/collections/${shareToken}/archive`}>
                Скачать всю коллекцию
              </a>
            </Button>
            {photographer ? (
              <Button asChild variant="secondary">
                <Link href={`/p/${photographer.username}`}>Профиль фотографа</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collection.photos.map((photo) => (
          <MediaTile
            key={photo.id}
            name={photo.originalName}
            status={photo.processingStatus}
            previewSrc={`/api/public/collections/${shareToken}/photos/${photo.id}/preview`}
            width={photo.width}
            height={photo.height}
            footer={
              <Button asChild variant="secondary" size="sm">
                <a href={`/api/public/collections/${shareToken}/photos/${photo.id}/download`}>
                  Скачать оригинал
                </a>
              </Button>
            }
          />
        ))}
      </section>
    </main>
  );
}
