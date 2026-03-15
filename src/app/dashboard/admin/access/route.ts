import { z } from "zod";

import { createSeeOtherRedirectResponse } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { updateUserAccessStatus } from "@/lib/services/access-service";

const accessSchema = z.object({
  userId: z.string().min(1),
  accessStatus: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]),
});

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const formData = await request.formData();
    const parsed = accessSchema.parse({
      userId: String(formData.get("userId") ?? ""),
      accessStatus: String(formData.get("accessStatus") ?? ""),
    });

    await updateUserAccessStatus({
      adminEmail: user.email ?? "",
      userId: parsed.userId,
      accessStatus: parsed.accessStatus,
    });

    return createSeeOtherRedirectResponse(request, "/dashboard/admin", {
      success: "Статус доступа обновлен.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить доступ.";

    return createSeeOtherRedirectResponse(request, "/dashboard/admin", {
      error: message,
    });
  }
}
