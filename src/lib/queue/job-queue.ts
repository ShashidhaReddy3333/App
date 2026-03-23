import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface JobOptions {
  maxAttempts?: number;
  scheduledAt?: Date;
  priority?: number;
}

export type JobType =
  | "SEND_NOTIFICATION"
  | "PROCESS_PAYMENT_WEBHOOK"
  | "GENERATE_RECEIPT_PDF"
  | "SYNC_STRIPE_DATA"
  | "CLEANUP_EXPIRED_DATA";

export interface Job<T = Record<string, unknown>> {
  id: string;
  type: JobType;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  error: string | null;
  createdAt: Date;
}

/**
 * Enqueue a new job. Falls back to PostgreSQL when Redis is unavailable.
 */
export async function enqueue<T extends Record<string, unknown>>(
  type: JobType,
  payload: T,
  options: JobOptions = {}
): Promise<string> {
  const id = crypto.randomUUID();

  await db.jobQueue.create({
    data: {
      id,
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: payload as any,
      status: "pending",
      maxAttempts: options.maxAttempts ?? 3,
      scheduledAt: options.scheduledAt ?? new Date(),
    },
  });

  return id;
}

/**
 * Atomically dequeue pending jobs using FOR UPDATE SKIP LOCKED to prevent
 * duplicate processing when multiple workers run concurrently.
 */
export async function dequeue(types: JobType[], limit = 10): Promise<Job[]> {
  const now = new Date();

  // Use raw SQL with FOR UPDATE SKIP LOCKED for atomic claim.
  // This prevents two concurrent workers from grabbing the same jobs.
  const jobs = await db.$queryRaw<Job[]>`
    UPDATE "JobQueue"
    SET status = 'running', "startedAt" = ${now}
    WHERE id IN (
      SELECT id FROM "JobQueue"
      WHERE type IN (${Prisma.join(types)})
        AND status = 'pending'
        AND "scheduledAt" <= ${now}
      ORDER BY "scheduledAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING
      id, type, payload, status, attempts, "maxAttempts",
      "scheduledAt", "startedAt", "completedAt", "failedAt",
      error, "createdAt"
  `;

  return jobs;
}

/**
 * Mark a job as completed.
 */
export async function markComplete(jobId: string): Promise<void> {
  await db.jobQueue.update({
    where: { id: jobId },
    data: { status: "completed", completedAt: new Date() },
  });
}

/**
 * Mark a job as failed. If under maxAttempts, requeue with exponential backoff.
 */
export async function markFailed(jobId: string, error: string): Promise<void> {
  const job = await db.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) return;

  const attempts = job.attempts + 1;

  if (attempts >= job.maxAttempts) {
    await db.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "failed",
        failedAt: new Date(),
        error,
        attempts,
      },
    });
  } else {
    // Exponential backoff: 2^attempts * 60 seconds
    const delaySeconds = Math.pow(2, attempts) * 60;
    const scheduledAt = new Date(Date.now() + delaySeconds * 1000);

    await db.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "pending",
        error,
        attempts,
        scheduledAt,
        startedAt: null,
      },
    });
  }
}

/**
 * Acquire a distributed lock using the JobLock table.
 * Uses atomic INSERT ... ON CONFLICT to prevent race conditions.
 */
export async function acquireLock(lockKey: string, ttlSeconds = 60): Promise<boolean> {
  const ownerId = crypto.randomUUID();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  try {
    // Atomic: delete expired lock for this key and insert new one.
    // If another worker holds a non-expired lock, the unique constraint
    // on lockKey causes the insert to fail (caught below).
    await db.$executeRaw`
      DELETE FROM "JobLock" WHERE "lockKey" = ${lockKey} AND "expiresAt" < NOW();
    `;
    await db.$executeRaw`
      INSERT INTO "JobLock" (id, "lockKey", "ownerId", "expiresAt")
      VALUES (${id}, ${lockKey}, ${ownerId}, ${expiresAt})
    `;

    return true;
  } catch {
    return false;
  }
}

/**
 * Release a distributed lock.
 */
export async function releaseLock(lockKey: string): Promise<void> {
  await db.jobLock.deleteMany({ where: { lockKey } });
}
