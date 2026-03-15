import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { createPhotographerService } from "@/lib/services/catalog-service";

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();
    const priceType =
      formData.get("priceType") === "PER_HOUR" ? "PER_HOUR" : "PER_SERVICE";

    await createPhotographerService(user.id, {
      title: String(formData.get("title") ?? ""),
      price: String(formData.get("price") ?? ""),
      priceType,
    });

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/services", {
          success: "Услуга добавлена.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить услугу.";

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/services", {
          error: message,
        }),
        request.url,
      ),
    );
  }
}
