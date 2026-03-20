import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/http";
import { getCurrentSession } from "@/lib/auth/session";
import { unauthorizedError } from "@/lib/errors";
import { listReviews, submitReview, submitReviewSchema } from "@/lib/services/marketplace-service";
import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    const profile = await db.businessProfile.findUnique({ where: { slug } });
    if (!profile) throw notFoundError("Business not found.");

    const result = await listReviews(profile.businessId, page, limit);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) throw unauthorizedError();

    const { slug } = await params;
    const body = await req.json();
    const input = submitReviewSchema.parse(body);

    const profile = await db.businessProfile.findUnique({ where: { slug } });
    if (!profile) throw notFoundError("Business not found.");

    const review = await submitReview(session.user.id, profile.businessId, input);
    return apiSuccess({ review }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
