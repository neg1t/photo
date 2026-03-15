import { createSeeOtherRedirectResponse } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { deletePortfolioAsset } from "@/lib/services/portfolio-service";

type RouteProps = {
  params: Promise<{ assetId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { assetId } = await params;

    await deletePortfolioAsset(user.id, assetId);

    return createSeeOtherRedirectResponse(request, "/dashboard/portfolio", {
      success: "Работа удалена из портфолио.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить работу.";

    return createSeeOtherRedirectResponse(request, "/dashboard/portfolio", {
      error: message,
    });
  }
}
