import Link from "next/link";
import { Camera, FolderOpen, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const highlights = [
  {
    icon: FolderOpen,
    title: "Коллекции по ссылке",
    description:
      "Загружайте съемки, публикуйте ссылку и отдавайте клиенту галерею без регистрации.",
  },
  {
    icon: Camera,
    title: "Публичное портфолио",
    description:
      "Показывайте лучшие работы, список услуг и Telegram-контакт на отдельной публичной странице.",
  },
  {
    icon: ShieldCheck,
    title: "Контроль себестоимости",
    description:
      "Лимиты хранилища, сроки хранения и автоочистка уже заложены в продукт.",
  },
];

export default function Home() {
  return (
    <main className="shell flex min-h-screen flex-col gap-10 py-8 md:py-12">
      <section className="overflow-hidden rounded-[36px] border border-black/8 bg-(--surface) px-6 py-8 shadow-[0_24px_64px_rgba(44,31,19,0.08)] md:px-10 md:py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-6">
            <Badge>Photo Delivery MVP</Badge>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                Photo Project.
              </h1>
              <p className="max-w-xl text-base leading-7 text-(--muted-foreground) md:text-lg">
                Личный кабинет для загрузки съемок, публичная галерея для
                клиента, портфолио с услугами и хранение, спроектированное под
                контроль затрат.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/login">Войти в кабинет</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="#features">Что внутри MVP</Link>
              </Button>
            </div>
          </div>
          <Card className="max-w-md bg-[rgba(255,250,246,0.94)]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-(--muted-foreground)">
                Боевой сценарий
              </p>
            </div>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-(--muted-foreground)">
              <li>1. Вход фотографа через Google</li>
              <li>2. Создание коллекции и загрузка фото пачкой</li>
              <li>3. Публикация ссылки клиенту</li>
              <li>4. Скачивание одного фото или всего ZIP</li>
              <li>5. Автоочистка после срока хранения</li>
            </ol>
          </Card>
        </div>
      </section>

      <section id="features" className="grid gap-5 md:grid-cols-3">
        {highlights.map((highlight) => (
          <Card key={highlight.title}>
            <highlight.icon className="h-6 w-6 text-accent" />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              {highlight.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-(--muted-foreground)">
              {highlight.description}
            </p>
          </Card>
        ))}
      </section>
    </main>
  );
}
