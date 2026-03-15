import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPublicProfileByUsername } from "@/lib/services/profile-service";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  return (
    <main className="shell flex min-h-screen flex-col gap-6 py-8">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,250,246,0.92),rgba(247,236,228,0.8))]">
        <Badge>Публичный профиль</Badge>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
              Фотограф с публичным портфолио, услугами и прямым Telegram-контактом.
            </p>
          </div>
          {profile.telegramUrl ? (
            <Button asChild>
              <a href={profile.telegramUrl} target="_blank" rel="noreferrer">
                Написать в Telegram
              </a>
            </Button>
          ) : null}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">
            Портфолио
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {profile.user.portfolioAssets.map((asset) => (
              <div
                key={asset.id}
                className="overflow-hidden rounded-[24px] border border-black/8 bg-white"
              >
                <Image
                  src={`/api/public/portfolio/${asset.id}/preview`}
                  alt={asset.originalName}
                  width={asset.width}
                  height={asset.height}
                  className="aspect-[4/3] h-auto w-full object-cover"
                />
              </div>
            ))}

            {!profile.user.portfolioAssets.length ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Портфолио пока не заполнено.
              </p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Услуги</h2>
          <div className="mt-5 space-y-3">
            {profile.user.services.map((service) => (
              <div
                key={service.id}
                className="rounded-[22px] border border-black/8 bg-white/70 p-4"
              >
                <p className="font-semibold">{service.title}</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {service.price.toString()} ₽ •{" "}
                  {service.priceType === "PER_HOUR" ? "за час" : "за услугу"}
                </p>
              </div>
            ))}

            {!profile.user.services.length ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Услуги пока не опубликованы.
              </p>
            ) : null}
          </div>

          <div className="mt-8 text-sm text-[var(--muted-foreground)]">
            <Link href="/" className="font-semibold text-[var(--foreground)]">
              Перейти на главную
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
