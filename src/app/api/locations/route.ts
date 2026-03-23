import { z } from "zod";

import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { locationSchema, updateLocationSchema } from "@/lib/schemas/platform";
import {
  createBusinessLocation,
  listBusinessLocations,
  updateBusinessLocation,
} from "@/lib/services/platform-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { businessId } = await requireApiAccess("settings", { request });
    const includeInactive = z
      .enum(["true", "false"])
      .optional()
      .parse(new URL(request.url).searchParams.get("includeInactive") ?? undefined);
    const locations = await listBusinessLocations(businessId, {
      includeInactive: includeInactive === "true",
    });
    return apiSuccess({ locations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("settings", { request });
    const payload = locationSchema.parse(await request.json());
    const location = await createBusinessLocation(session.user.id, businessId, payload);
    return apiSuccess({ location }, { status: 201, message: "Location created." });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("settings", { request });
    const payload = updateLocationSchema.parse(await request.json());
    const location = await updateBusinessLocation(session.user.id, businessId, payload);
    return apiSuccess({ location }, { message: "Location updated." });
  } catch (error) {
    return apiError(error);
  }
}
