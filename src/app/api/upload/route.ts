import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { uploadFile } from "@/lib/storage/blob";
import { db } from "@/lib/db";
import { validationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const metadataSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { session, businessId } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      request: req,
    });

    const formData = await req.formData();
    const file = formData.get("file");
    const entityType = formData.get("entityType")?.toString();
    const entityId = formData.get("entityId")?.toString();

    if (!file || !(file instanceof File)) {
      throw validationError("No file provided.");
    }

    const { entityType: validEntityType, entityId: validEntityId } = metadataSchema.parse({
      entityType,
      entityId,
    });

    const pathPrefix = businessId
      ? `businesses/${businessId}/${validEntityType ?? "general"}`
      : `users/${session.user.id}`;

    const result = await uploadFile(file, pathPrefix);

    // Record in MediaAsset table
    const asset = await db.mediaAsset.create({
      data: {
        id: crypto.randomUUID(),
        key: result.key,
        url: result.url,
        contentType: result.contentType,
        size: result.size,
        uploadedById: session.user.id,
        entityType: validEntityType ?? null,
        entityId: validEntityId ?? null,
        businessId: businessId ?? null,
      },
    });

    return apiSuccess({
      asset: {
        id: asset.id,
        url: asset.url,
        key: asset.key,
        contentType: asset.contentType,
        size: asset.size,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
