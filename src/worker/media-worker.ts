import { setTimeout as sleep } from "node:timers/promises";

import { processNextPendingMediaJob } from "@/lib/services/media-processing-service";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

async function runWorker() {
  const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? DEFAULT_POLL_INTERVAL_MS);

  while (true) {
    try {
      const job = await processNextPendingMediaJob();

      if (!job) {
        await sleep(pollIntervalMs);
        continue;
      }

      console.info(
        `[media-worker] processed ${job.type}:${job.id} -> ${job.result ?? "skipped"}`,
      );
    } catch (error) {
      console.error("[media-worker] processing failed", error);
      await sleep(pollIntervalMs);
    }
  }
}

void runWorker();
