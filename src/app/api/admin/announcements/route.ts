import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { getCurrentSession } from "@/lib/auth/session";
import { forbiddenError, notFoundError, unauthorizedError } from "@/lib/errors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) throw unauthorizedError();
  if (session.user.role !== "platform_admin") throw forbiddenError();
  return session;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      db.platformAnnouncement.findMany({
        include: { author: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.platformAnnouncement.count(),
    ]);

    return apiSuccess({ announcements, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(["info", "warning", "maintenance", "feature"]).default("info"),
  audience: z.enum(["all", "businesses", "customers", "suppliers"]).default("all"),
  isPublished: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = createAnnouncementSchema.parse(body);

    const announcement = await db.platformAnnouncement.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        authorId: session.user.id,
        publishedAt: data.isPublished ? new Date() : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return apiSuccess({ announcement }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

const updateAnnouncementSchema = z.object({
  announcementId: z.string(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { announcementId, ...data } = updateAnnouncementSchema.parse(body);

    const announcement = await db.platformAnnouncement.findUnique({ where: { id: announcementId } });
    if (!announcement) throw notFoundError("Announcement not found.");

    const updateData: Record<string, unknown> = { ...data };
    if (data.isPublished === true && !announcement.publishedAt) {
      updateData.publishedAt = new Date();
    }
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const updated = await db.platformAnnouncement.update({
      where: { id: announcementId },
      data: updateData,
    });

    return apiSuccess({ announcement: updated });
  } catch (error) {
    return apiError(error);
  }
}
