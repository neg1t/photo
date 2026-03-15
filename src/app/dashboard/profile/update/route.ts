import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { updateProfileForUser } from "@/lib/services/profile-service";

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();

    await updateProfileForUser(user.id, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      username: String(formData.get("username") ?? ""),
      telegramUrl: String(formData.get("telegramUrl") ?? ""),
    });

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/profile", {
          success: "Профиль обновлен.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить профиль.";

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/profile", {
          error: message,
        }),
        request.url,
      ),
    );
  }
}
