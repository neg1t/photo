import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
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

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/collections", {
          success: "Коллекция опубликована.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось опубликовать коллекцию.";

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
