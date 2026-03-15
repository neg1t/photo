import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getStorageObject } from "@/lib/storage/s3";

type RouteProps = {
  params: Promise<{ assetId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { assetId } = await params;
  const asset = await prisma.portfolioAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storedObject = await getStorageObject(asset.previewKey);

  return new NextResponse(Buffer.from(storedObject.bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
