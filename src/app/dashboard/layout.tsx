import Link from "next/link";
import { LayoutDashboard, FolderOpen, Images, BriefcaseBusiness, UserRound, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/session";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/collections", label: "Коллекции", icon: FolderOpen },
  { href: "/dashboard/portfolio", label: "Портфолио", icon: Images },
  { href: "/dashboard/services", label: "Услуги", icon: BriefcaseBusiness },
  { href: "/dashboard/profile", label: "Профиль", icon: UserRound },
  { href: "/dashboard/admin", label: "Админка", icon: Shield },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const usagePercent = Number(
    (user.storageUsedBytes * 100n) / (user.storageLimitBytes || 1n),
  );

  return (
    <div className="shell grid min-h-screen gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-5">
        <Card className="sticky top-6 space-y-5">
          <div>
            <Badge>{user.accessStatus}</Badge>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
              {user.profile?.firstName || "Фотограф"} {user.profile?.lastName}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              @{user.profile?.username}
            </p>
          </div>

          <div className="space-y-3 rounded-[24px] bg-[#f9f1e7] p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              <span>Хранилище</span>
              <span>{usagePercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatBytes(user.storageUsedBytes)} из{" "}
              {formatBytes(user.storageLimitBytes)}
            </p>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-black/5 hover:text-[var(--foreground)]"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <Button asChild variant="secondary" className="w-full">
            <Link href="/api/auth/signout?callbackUrl=/">Выйти</Link>
          </Button>
        </Card>
      </aside>

      <section className="space-y-6">{children}</section>
    </div>
  );
}
