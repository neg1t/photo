import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-6">
      <NoticeBanner error={error} success={success} />

      <Card>
        <Badge>Профиль</Badge>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Публичный адрес фотографа
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Профиль будет доступен по адресу `/p/{user.profile?.username}`. Если
          username занят, система автоматически подберет свободный вариант.
        </p>

        <form
          action="/dashboard/profile/update"
          method="post"
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <Input
            name="firstName"
            placeholder="Имя"
            defaultValue={user.profile?.firstName}
          />
          <Input
            name="lastName"
            placeholder="Фамилия"
            defaultValue={user.profile?.lastName}
          />
          <Input
            name="username"
            placeholder="username"
            defaultValue={user.profile?.username}
          />
          <Input
            name="telegramUrl"
            placeholder="https://t.me/username"
            defaultValue={user.profile?.telegramUrl ?? ""}
          />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить профиль</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
