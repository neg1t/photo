import { createSeeOtherRedirectResponse } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { publishCollectionForUser } from "@/lib/services/collections-service";

type RouteProps = {
  params: Promise<{ collectionId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { collectionId } = await params;

    await publishCollectionForUser(user.id, collectionId);

    return createSeeOtherRedirectResponse(request, "/dashboard/collections", {
      success: "Коллекция опубликована.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось опубликовать коллекцию.";

    return createSeeOtherRedirectResponse(request, "/dashboard/collections", {
      error: message,
    });
  }
}
