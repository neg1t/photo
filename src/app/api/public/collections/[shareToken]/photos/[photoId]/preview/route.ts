import { NextResponse } from "next/server";

import { getPublicPreviewForPhoto } from "@/lib/services/collections-service";

type RouteProps = {
  params: Promise<{ shareToken: string; photoId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { shareToken, photoId } = await params;
    const storedObject = await getPublicPreviewForPhoto(shareToken, photoId);

    return new NextResponse(Buffer.from(storedObject.bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 404;

    return new NextResponse("Not found", { status });
  }
}
