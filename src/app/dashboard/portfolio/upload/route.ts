import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import { createRedirectPath } from "@/lib/http";
import { requireRouteUser } from "@/lib/route-user";
import {
  completePortfolioAssetUploads,
  preparePortfolioAssetUploads,
} from "@/lib/services/portfolio-service";
import { uploadRoutePayloadSchema } from "@/lib/uploads";

function createJsonErrorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
      redirectTo: createRedirectPath("/dashboard/portfolio", {
        error: message,
      }),
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser();
    const payload = uploadRoutePayloadSchema.parse(await request.json());

    if (payload.intent === "prepare") {
      const uploads = await preparePortfolioAssetUploads({
        userId: user.id,
        files: payload.files,
      });

      return NextResponse.json({ uploads });
    }

    await completePortfolioAssetUploads({
      userId: user.id,
      uploads: payload.uploads,
    });

    return NextResponse.json({
      redirectTo: createRedirectPath("/dashboard/portfolio", {
        success: "Работы добавлены в портфолио.",
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return createJsonErrorResponse("Некорректный запрос на загрузку.");
    }

    if (error instanceof AppError) {
      return createJsonErrorResponse(error.message, error.status);
    }

    return createJsonErrorResponse("Не удалось загрузить портфолио.", 500);
  }
}
