import { NextResponse } from "next/server";

import { getOrCreateArchiveForCollection } from "@/lib/services/collections-service";
import { getStorageObject } from "@/lib/storage/s3";

type RouteProps = {
  params: Promise<{ shareToken: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { shareToken } = await params;
    const archive = await getOrCreateArchiveForCollection(shareToken);
    const storedObject = await getStorageObject(archive.storageKey);

    return new NextResponse(Buffer.from(storedObject.bytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          archive.fileName,
        )}`,
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 404;

    return new NextResponse("Archive unavailable", { status });
  }
}
