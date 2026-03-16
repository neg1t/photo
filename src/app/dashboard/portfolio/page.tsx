import { DashboardFileUploadForm } from "@/components/dashboard/dashboard-file-upload-form";
import { MediaTile } from "@/components/media/media-tile";
import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildPhotoFileInputAccept } from "@/lib/media-upload";
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
  const photoInputAccept = buildPhotoFileInputAccept();

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Портфолио</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Отдельная витрина фотографа
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
          Портфолио загружается отдельно от клиентских коллекций, но расходует тот
          же общий лимит хранилища.
        </p>

        <div className="mt-6 flex flex-col gap-4 rounded-[24px] bg-[#f8f1e7] p-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Поддерживаются фотографии и исходники камер. После выбора файлов
            загрузка начнется сразу, а превью появятся после фоновой обработки.
          </p>
          <DashboardFileUploadForm
            endpoint="/dashboard/portfolio/upload"
            resultPath="/dashboard/portfolio"
            accept={photoInputAccept}
            buttonLabel="Добавить в портфолио"
            pendingLabel="Загружаем портфолио..."
            disabled={!canUpload}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {user.portfolioAssets.map((asset) => (
          <MediaTile
            key={asset.id}
            name={asset.originalName}
            status={asset.processingStatus}
            previewSrc={`/api/public/portfolio/${asset.id}/preview`}
            width={asset.width}
            height={asset.height}
            footer={
              <form action={`/dashboard/portfolio/${asset.id}/delete`} method="post">
                <Button type="submit" variant="danger" size="sm">
                  Удалить
                </Button>
              </form>
            }
          />
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
