import { NextResponse } from "next/server";

import { getPublicOriginalForPhoto } from "@/lib/services/collections-service";

type RouteProps = {
  params: Promise<{ shareToken: string; photoId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { shareToken, photoId } = await params;
    const storedObject = await getPublicOriginalForPhoto(shareToken, photoId);

    return new NextResponse(Buffer.from(storedObject.bytes), {
      headers: {
        "Content-Type": storedObject.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          storedObject.fileName,
        )}`,
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
