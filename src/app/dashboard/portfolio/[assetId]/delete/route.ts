import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { deletePortfolioAsset } from "@/lib/services/portfolio-service";

type RouteProps = {
  params: Promise<{ assetId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { assetId } = await params;

    await deletePortfolioAsset(user.id, assetId);

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/portfolio", {
          success: "Работа удалена из портфолио.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось удалить работу.";

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/portfolio", {
          error: message,
        }),
        request.url,
      ),
    );
  }
}
