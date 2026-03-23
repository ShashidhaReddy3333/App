import { LocationsManager } from "@/components/locations-manager";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { listBusinessLocations } from "@/lib/services/platform-service";

export default async function LocationsPage() {
  const session = await requirePermission("settings");
  const locations = await listBusinessLocations(session.user.businessId!, {
    includeInactive: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage store locations used for stock allocation, online order fulfillment, and inventory transfers."
        breadcrumbs={[{ label: "Locations" }]}
      />
      <LocationsManager
        locations={locations.map((location) => ({
          id: location.id,
          name: location.name,
          addressLine1: location.addressLine1,
          addressLine2: location.addressLine2,
          city: location.city,
          provinceOrState: location.provinceOrState,
          postalCode: location.postalCode,
          country: location.country,
          timezone: location.timezone,
          isActive: location.isActive,
        }))}
      />
    </div>
  );
}
