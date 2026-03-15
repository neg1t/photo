import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerAuthSession();
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="shell flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-xl">
        <Badge>Авторизация</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
          Вход для фотографа
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
          Для MVP вход выполняется через Google OAuth. После первого входа
          аккаунт и публичный профиль создаются автоматически.
        </p>

        {env.auth.isGoogleConfigured ? (
          <div className="mt-8">
            <Button asChild className="w-full">
              <a href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                Продолжить через Google
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-[#d2b58a] bg-[#fff7ea] p-5 text-sm text-[#7d5525]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold">
                  Google OAuth credentials пока не подключены.
                </p>
                <p>
                  Как только появятся `GOOGLE_CLIENT_ID` и
                  `GOOGLE_CLIENT_SECRET`, эта кнопка автоматически заработает.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-[var(--muted-foreground)]">
          <Link href="/" className="font-semibold text-[var(--foreground)]">
            Вернуться на главную
          </Link>
        </div>
      </Card>
    </main>
  );
}
