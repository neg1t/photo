import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Услуги</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Что видит клиент на публичной странице
        </h2>
        <form
          action="/dashboard/services/create"
          method="post"
          className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_180px_180px]"
        >
          <Input name="title" placeholder="Например, Свадебная съемка" />
          <Input name="price" placeholder="25000" />
          <select
            name="priceType"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            defaultValue="PER_SERVICE"
          >
            <option value="PER_SERVICE">За услугу</option>
            <option value="PER_HOUR">За час</option>
          </select>
          <Button type="submit">Добавить услугу</Button>
        </form>
      </Card>

      <div className="grid gap-4">
        {user.services.map((service) => (
          <Card
            key={service.id}
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold">{service.title}</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {service.price.toString()} ₽ •{" "}
                {service.priceType === "PER_HOUR" ? "за час" : "за услугу"}
              </p>
            </div>
            <form action={`/dashboard/services/${service.id}/delete`} method="post">
              <Button type="submit" variant="danger" size="sm">
                Удалить
              </Button>
            </form>
          </Card>
        ))}

        {!user.services.length ? (
          <Card className="text-sm text-[var(--muted-foreground)]">
            Пока не добавлено ни одной услуги.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
