import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { uploadPortfolioAssets } from "@/lib/services/portfolio-service";

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();
    const files = formData
      .getAll("portfolio")
      .filter((file): file is File => file instanceof File && file.size > 0);

    await uploadPortfolioAssets({
      userId: user.id,
      files,
    });

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/portfolio", {
          success: "Работы добавлены в портфолио.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить портфолио.";

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
