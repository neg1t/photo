import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { runCleanupJob } from "@/lib/services/cleanup-service";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");

  if (secret !== env.cleanup.cronSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runCleanupJob();

  return NextResponse.json(result);
}
