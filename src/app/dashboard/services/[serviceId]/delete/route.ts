import { createSeeOtherRedirectResponse } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { deletePhotographerService } from "@/lib/services/catalog-service";

type RouteProps = {
  params: Promise<{ serviceId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { serviceId } = await params;

    await deletePhotographerService(user.id, serviceId);

    return createSeeOtherRedirectResponse(request, "/dashboard/services", {
      success: "Услуга удалена.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить услугу.";

    return createSeeOtherRedirectResponse(request, "/dashboard/services", {
      error: message,
    });
  }
}
