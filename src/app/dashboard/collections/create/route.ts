import { NextResponse } from "next/server";

import { createCollectionForUser } from "@/lib/services/collections-service";
import { requireRouteUser } from "@/lib/route-user";
import { createRedirectPath } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();

    await createCollectionForUser(user.id, {
      title: String(formData.get("title") ?? ""),
      expiresAt: String(formData.get("expiresAt") ?? ""),
    });

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/collections", {
          success: "Коллекция создана.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось создать коллекцию.";

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/collections", {
          error: message,
        }),
        request.url,
      ),
    );
  }
}
