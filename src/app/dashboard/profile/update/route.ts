import { createSeeOtherRedirectResponse } from "@/lib/http";
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

    return createSeeOtherRedirectResponse(request, "/dashboard/profile", {
      success: "Профиль обновлен.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить профиль.";

    return createSeeOtherRedirectResponse(request, "/dashboard/profile", {
      error: message,
    });
  }
}
