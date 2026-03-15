import Image from "next/image";

import { NoticeBanner } from "@/components/notice-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type PortfolioPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PortfolioPage({
  searchParams,
}: PortfolioPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;
  const canUpload = user.accessStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Портфолио</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Отдельная витрина фотографа
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Портфолио загружается отдельно от клиентских коллекций, но расходует
          тот же общий лимит хранилища.
        </p>

        <form
          action="/dashboard/portfolio/upload"
          method="post"
          encType="multipart/form-data"
          className="mt-6 flex flex-col gap-4 rounded-[24px] bg-[#f8f1e7] p-4 lg:flex-row lg:items-center"
        >
          <input
            type="file"
            name="portfolio"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="block flex-1 text-sm text-[var(--muted-foreground)]"
          />
          <Button type="submit" disabled={!canUpload}>
            Добавить в портфолио
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {user.portfolioAssets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden p-0">
            <Image
              src={`/api/public/portfolio/${asset.id}/preview`}
              alt={asset.originalName}
              width={asset.width}
              height={asset.height}
              className="aspect-[4/3] h-auto w-full object-cover"
            />
            <div className="space-y-3 p-4">
              <p className="line-clamp-1 font-medium">{asset.originalName}</p>
              <form
                action={`/dashboard/portfolio/${asset.id}/delete`}
                method="post"
              >
                <Button type="submit" variant="danger" size="sm">
                  Удалить
                </Button>
              </form>
            </div>
          </Card>
        ))}

        {!user.portfolioAssets.length ? (
          <Card className="sm:col-span-2 xl:col-span-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Пока нет ни одной работы в портфолио.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
