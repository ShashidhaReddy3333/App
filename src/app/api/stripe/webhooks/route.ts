import { NextRequest, NextResponse } from "next/server";
import { constructEvent, processWebhookEvent } from "@/lib/stripe/webhooks";

export const dynamic = "force-dynamic";

// Stripe sends raw body — must disable body parsing
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let rawBody: Buffer;
  try {
    const arrayBuffer = await req.arrayBuffer();
    rawBody = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  let event;
  try {
    event = constructEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await processWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("[Stripe Webhook] Processing error:", message);
    // Return 200 to prevent Stripe from retrying events that we intentionally fail
    return NextResponse.json({ received: true, error: message }, { status: 200 });
  }
}
