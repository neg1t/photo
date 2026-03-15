import Image from "next/image";
import Link from "next/link";

import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CollectionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;
  const canUpload = user.accessStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Коллекции</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Новая съемка
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Создайте коллекцию, укажите срок хранения и сразу загрузите фотографии
          пачкой. После публикации клиент откроет галерею по отдельной ссылке.
        </p>

        <form
          action="/dashboard/collections/create"
          method="post"
          className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_180px]"
        >
          <Input name="title" placeholder="Например, Love story • Марина и Илья" />
          <Input name="expiresAt" type="date" />
          <Button type="submit" disabled={!canUpload}>
            Создать коллекцию
          </Button>
        </form>
      </Card>

      <div className="grid gap-5">
        {user.collections.map((collection) => {
          const publicLink = collection.shareToken
            ? `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/g/${collection.shareToken}`
            : null;

          return (
            <Card key={collection.id}>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                      {collection.title}
                    </h3>
                    <Badge>{collection.status}</Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Хранение до {collection.expiresAt.toLocaleDateString("ru-RU")} •{" "}
                    {collection.photos.length} фото
                  </p>
                  {publicLink ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Публичная ссылка:{" "}
                      <Link
                        href={`/g/${collection.shareToken}`}
                        className="font-semibold text-[var(--foreground)]"
                      >
                        {publicLink}
                      </Link>
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <form
                    action={`/dashboard/collections/${collection.id}/publish`}
                    method="post"
                  >
                    <Button type="submit" disabled={!canUpload}>
                      Опубликовать
                    </Button>
                  </form>
                </div>
              </div>

              <form
                action={`/dashboard/collections/${collection.id}/upload`}
                method="post"
                encType="multipart/form-data"
                className="mt-6 flex flex-col gap-4 rounded-[24px] bg-[#f8f1e7] p-4 lg:flex-row lg:items-center"
              >
                <input
                  type="file"
                  name="photos"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="block flex-1 text-sm text-[var(--muted-foreground)]"
                />
                <Button type="submit" disabled={!canUpload}>
                  Загрузить фото
                </Button>
              </form>

              {collection.photos.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {collection.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-[22px] border border-black/8 bg-white/70"
                    >
                      {collection.shareToken ? (
                        <Image
                          src={`/api/public/collections/${collection.shareToken}/photos/${photo.id}/preview`}
                          alt={photo.originalName}
                          width={photo.width}
                          height={photo.height}
                          className="aspect-[4/3] h-auto w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[4/3] bg-[#efe3d3]" />
                      )}
                      <div className="p-3 text-sm">
                        <p className="line-clamp-1 font-medium">{photo.originalName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}

        {!user.collections.length ? (
          <Card className="text-sm text-[var(--muted-foreground)]">
            Коллекций пока нет. Создайте первую и загрузите фотографии пачкой.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
