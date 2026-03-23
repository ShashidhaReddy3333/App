import { cookies } from "next/headers";

import {
  ACTIVE_BUSINESS_LOCATION_COOKIE,
  STOREFRONT_LOCATION_COOKIE,
} from "@/lib/location-preferences";
import { listBusinessLocations, resolveBusinessLocation } from "@/lib/services/platform-service";

export async function getBusinessLocationContext(businessId: string) {
  const cookieStore = await cookies();
  const requestedLocationId = cookieStore.get(ACTIVE_BUSINESS_LOCATION_COOKIE)?.value ?? undefined;
  const [location, locations] = await Promise.all([
    resolveBusinessLocation(businessId, requestedLocationId),
    listBusinessLocations(businessId),
  ]);

  return {
    requestedLocationId,
    location,
    locations,
  };
}

export async function getStorefrontLocationPreference() {
  const cookieStore = await cookies();
  return cookieStore.get(STOREFRONT_LOCATION_COOKIE)?.value ?? undefined;
}
