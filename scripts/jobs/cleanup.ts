import { runCleanupJob } from "@/lib/services/cleanup-service";

async function main() {
  const result = await runCleanupJob();

  console.info(JSON.stringify(result, null, 2));
}

void main();
