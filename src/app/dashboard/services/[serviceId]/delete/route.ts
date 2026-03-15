import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
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

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/services", {
          success: "Услуга удалена.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось удалить услугу.";

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
