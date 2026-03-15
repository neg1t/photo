import { NextResponse } from "next/server";

import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import { uploadPhotosToCollection } from "@/lib/services/collections-service";

type RouteProps = {
  params: Promise<{ collectionId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { collectionId } = await params;
    const formData = await request.formData();
    const files = formData
      .getAll("photos")
      .filter((file): file is File => file instanceof File && file.size > 0);

    await uploadPhotosToCollection({
      userId: user.id,
      collectionId,
      files,
    });

    return NextResponse.redirect(
      new URL(
        createRedirectPath("/dashboard/collections", {
          success: "Фотографии загружены.",
        }),
        request.url,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось загрузить фотографии.";

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
