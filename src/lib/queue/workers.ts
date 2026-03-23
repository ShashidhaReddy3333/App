import type { JobType } from "./job-queue";
import { db } from "@/lib/db";
import { logEvent } from "@/lib/observability";

export type WorkerFn = (job: { id: string; payload: Record<string, unknown> }) => Promise<void>;

/**
 * Worker: send a notification (email/push/SMS)
 */
async function sendNotificationWorker(job: { id: string; payload: Record<string, unknown> }) {
  const { notificationId } = job.payload;

  if (!notificationId || typeof notificationId !== "string") {
    throw new Error("Missing notificationId in payload");
  }

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.status === "sent") {
    return; // Already sent or not found
  }

  // Mark as sent (actual sending happens via email service — integrate Resend here)
  await db.notification.update({
    where: { id: notificationId },
    data: { status: "sent", sentAt: new Date() },
  });
}

/**
 * Worker: process a Stripe payment webhook event
 */
async function processPaymentWebhookWorker(job: { id: string; payload: Record<string, unknown> }) {
  const { stripeEventId } = job.payload;

  if (!stripeEventId || typeof stripeEventId !== "string") {
    throw new Error("Missing stripeEventId in payload");
  }

  const event = await db.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });

  if (!event || event.processedAt) {
    return; // Already processed
  }

  // Re-process via webhooks module
  const { processWebhookEvent } = await import("@/lib/stripe/webhooks");
  // Reconstruct the event from stored payload
  const rawPayload = JSON.stringify(event.payload);
  const stripeEvent = JSON.parse(rawPayload);
  await processWebhookEvent(stripeEvent as Parameters<typeof processWebhookEvent>[0]);
}

/**
 * Worker: sync Stripe account data for a business
 */
async function syncStripeDataWorker(job: { id: string; payload: Record<string, unknown> }) {
  const { businessId } = job.payload;
  if (!businessId || typeof businessId !== "string") {
    throw new Error("Missing businessId in payload");
  }

  const { getAccountStatus } = await import("@/lib/stripe/connect");
  await getAccountStatus(businessId);
}

/**
 * Worker: clean up expired data (reservations, sessions, etc.)
 */
async function cleanupExpiredDataWorker(job: { id: string; payload: Record<string, unknown> }) {
  void job;
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  await Promise.all([
    // Clean up expired sessions
    db.session.deleteMany({
      where: { expiresAt: { lt: new Date() }, revokedAt: null },
    }),
    // Clean up old webhook events
    db.stripeWebhookEvent.deleteMany({
      where: { processedAt: { lt: cutoff } },
    }),
    // Clean up completed jobs older than 7 days
    db.jobQueue.deleteMany({
      where: {
        status: { in: ["completed", "failed"] },
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Clean up expired job locks
    db.jobLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);
}

/**
 * Worker: generate receipt PDF (stub — integrate PDF library as needed)
 */
async function generateReceiptPdfWorker(job: { id: string; payload: Record<string, unknown> }) {
  const { saleId } = job.payload;
  if (!saleId || typeof saleId !== "string") {
    throw new Error("Missing saleId in payload");
  }

  logEvent("info", "receipt_pdf_generation_requested", {
    saleId,
    jobId: job.id,
  });
}

export const WORKERS: Record<JobType, WorkerFn> = {
  SEND_NOTIFICATION: sendNotificationWorker,
  PROCESS_PAYMENT_WEBHOOK: processPaymentWebhookWorker,
  GENERATE_RECEIPT_PDF: generateReceiptPdfWorker,
  SYNC_STRIPE_DATA: syncStripeDataWorker,
  CLEANUP_EXPIRED_DATA: cleanupExpiredDataWorker,
};
