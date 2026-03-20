import { NextRequest, NextResponse } from "next/server";
import { dequeue, markComplete, markFailed, acquireLock, releaseLock } from "@/lib/queue/job-queue";
import { WORKERS } from "@/lib/queue/workers";
import type { JobType } from "@/lib/queue/job-queue";
import { getOptionalCronSecret } from "@/lib/env";

export const dynamic = "force-dynamic";

const ALL_JOB_TYPES: JobType[] = [
  "SEND_NOTIFICATION",
  "PROCESS_PAYMENT_WEBHOOK",
  "GENERATE_RECEIPT_PDF",
  "SYNC_STRIPE_DATA",
  "CLEANUP_EXPIRED_DATA",
];

export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = getOptionalCronSecret();
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const lockKey = "process-queue";
  const acquired = await acquireLock(lockKey, 300); // 5 min TTL
  if (!acquired) {
    return NextResponse.json({ message: "Queue processor already running" });
  }

  let processed = 0;
  let failed = 0;

  try {
    const jobs = await dequeue(ALL_JOB_TYPES, 20);

    await Promise.allSettled(
      jobs.map(async (job) => {
        const worker = WORKERS[job.type as JobType];
        if (!worker) {
          await markFailed(job.id, `No worker registered for job type: ${job.type}`);
          failed++;
          return;
        }

        try {
          await worker({ id: job.id, payload: job.payload as Record<string, unknown> });
          await markComplete(job.id);
          processed++;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await markFailed(job.id, message);
          failed++;
        }
      })
    );
  } finally {
    await releaseLock(lockKey);
  }

  return NextResponse.json({
    message: "Queue processed",
    processed,
    failed,
  });
}

// Allow GET for easy manual triggering via browser in dev
export async function GET(req: NextRequest) {
  return POST(req);
}
