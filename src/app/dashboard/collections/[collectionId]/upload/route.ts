import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createRedirectPath } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { requireRouteUser } from "@/lib/route-user";
import {
  completeCollectionPhotoUploads,
  prepareCollectionPhotoUploads,
} from "@/lib/services/collections-service";
import { uploadRoutePayloadSchema } from "@/lib/uploads";

type RouteProps = {
  params: Promise<{ collectionId: string }>;
};

function createJsonErrorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
      redirectTo: createRedirectPath("/dashboard/collections", {
        error: message,
      }),
    },
    { status },
  );
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const user = await requireRouteUser();
    const { collectionId } = await params;
    const payload = uploadRoutePayloadSchema.parse(await request.json());

    if (payload.intent === "prepare") {
      const uploads = await prepareCollectionPhotoUploads({
        userId: user.id,
        collectionId,
        files: payload.files,
      });

      return NextResponse.json({ uploads });
    }

    await completeCollectionPhotoUploads({
      userId: user.id,
      collectionId,
      uploads: payload.uploads,
    });

    return NextResponse.json({
      redirectTo: createRedirectPath("/dashboard/collections", {
        success: "Фотографии загружены.",
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return createJsonErrorResponse("Некорректный запрос на загрузку.");
    }

    if (error instanceof AppError) {
      return createJsonErrorResponse(error.message, error.status);
    }

    return createJsonErrorResponse("Не удалось загрузить фотографии.", 500);
  }
}
