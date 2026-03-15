import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { NoticeBanner } from "@/components/notice-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getServerAuthSession } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getLoginErrorMessage(error?: string) {
  if (!error) {
    return undefined;
  }

  switch (error) {
    case "google":
    case "OAuthSignin":
      return "Не удалось начать вход через Google. Повторите попытку еще раз.";
    case "OAuthCallback":
      return "Google не подтвердил вход. Попробуйте авторизоваться еще раз.";
    case "AccessDenied":
      return "Доступ к аккаунту не был подтвержден.";
    case "Configuration":
      return "Авторизация временно недоступна из-за конфигурации сервиса.";
    default:
      return "Не удалось выполнить вход. Повторите попытку немного позже.";
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerAuthSession();
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";
  const error =
    typeof params.error === "string"
      ? getLoginErrorMessage(params.error)
      : undefined;

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
        <div className="mt-6">
          <NoticeBanner error={error} />
        </div>

        {env.auth.isGoogleConfigured ? (
          <div className="mt-8">
            <GoogleSignInButton callbackUrl={callbackUrl} />
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
