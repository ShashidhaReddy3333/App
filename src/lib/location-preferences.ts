export const ACTIVE_BUSINESS_LOCATION_COOKIE = "hp_active_location";
export const STOREFRONT_LOCATION_COOKIE = "hp_storefront_location";
export const LOCATION_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365;

export function buildLocationPreferenceCookie(name: string, value: string) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${LOCATION_PREFERENCE_MAX_AGE}; SameSite=Lax`;
}

export function resolvePreferredLocationId<
  TLocation extends {
    id: string;
    isActive?: boolean;
  },
>(locations: TLocation[], requestedLocationId?: string | null, fallbackLocationId?: string | null) {
  const activeLocations = locations.filter((location) => location.isActive !== false);
  if (activeLocations.length === 0) {
    return null;
  }

  const requestedMatch = requestedLocationId
    ? activeLocations.find((location) => location.id === requestedLocationId)
    : null;
  if (requestedMatch) {
    return requestedMatch.id;
  }

  const fallbackMatch = fallbackLocationId
    ? activeLocations.find((location) => location.id === fallbackLocationId)
    : null;
  if (fallbackMatch) {
    return fallbackMatch.id;
  }

  return activeLocations[0]?.id ?? null;
}
