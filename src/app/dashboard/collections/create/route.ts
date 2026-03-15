import { createSeeOtherRedirectResponse } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { createCollectionForUser } from "@/lib/services/collections-service";

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();

    await createCollectionForUser(user.id, {
      title: String(formData.get("title") ?? ""),
      expiresAt: String(formData.get("expiresAt") ?? ""),
    });

    return createSeeOtherRedirectResponse(request, "/dashboard/collections", {
      success: "Коллекция создана.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать коллекцию.";

    return createSeeOtherRedirectResponse(request, "/dashboard/collections", {
      error: message,
    });
  }
}
