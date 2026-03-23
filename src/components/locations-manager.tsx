"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type LocationRecord = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  provinceOrState: string;
  postalCode: string;
  country: string;
  timezone: string | null;
  isActive: boolean;
};

type LocationDraft = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceOrState: string;
  postalCode: string;
  country: string;
  timezone: string;
};

const emptyDraft: LocationDraft = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  provinceOrState: "",
  postalCode: "",
  country: "CA",
  timezone: "",
};

function toDraft(location: LocationRecord): LocationDraft {
  return {
    name: location.name,
    addressLine1: location.addressLine1,
    addressLine2: location.addressLine2 ?? "",
    city: location.city,
    provinceOrState: location.provinceOrState,
    postalCode: location.postalCode,
    country: location.country,
    timezone: location.timezone ?? "",
  };
}

function LocationFields({
  prefix,
  draft,
  onChange,
}: {
  prefix: string;
  draft: LocationDraft;
  onChange: (field: keyof LocationDraft, value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input
          id={`${prefix}-name`}
          value={draft.name}
          onChange={(event) => onChange("name", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address1`}>Address line 1</Label>
        <Input
          id={`${prefix}-address1`}
          value={draft.addressLine1}
          onChange={(event) => onChange("addressLine1", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address2`}>Address line 2</Label>
        <Input
          id={`${prefix}-address2`}
          value={draft.addressLine2}
          onChange={(event) => onChange("addressLine2", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-city`}>City</Label>
        <Input
          id={`${prefix}-city`}
          value={draft.city}
          onChange={(event) => onChange("city", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-province`}>Province / State</Label>
        <Input
          id={`${prefix}-province`}
          value={draft.provinceOrState}
          onChange={(event) => onChange("provinceOrState", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-postal`}>Postal / ZIP</Label>
        <Input
          id={`${prefix}-postal`}
          value={draft.postalCode}
          onChange={(event) => onChange("postalCode", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-country`}>Country code</Label>
        <Input
          id={`${prefix}-country`}
          value={draft.country}
          maxLength={2}
          onChange={(event) => onChange("country", event.target.value.toUpperCase())}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-timezone`}>Timezone</Label>
        <Input
          id={`${prefix}-timezone`}
          value={draft.timezone}
          onChange={(event) => onChange("timezone", event.target.value)}
          placeholder="America/Toronto"
        />
      </div>
    </div>
  );
}

export function LocationsManager({ locations }: { locations: LocationRecord[] }) {
  const router = useRouter();
  const [createDraft, setCreateDraft] = useState<LocationDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<LocationDraft>(emptyDraft);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const activeCount = useMemo(
    () => locations.filter((location) => location.isActive).length,
    [locations]
  );

  async function createLocation() {
    setBusyKey("create");
    try {
      await requestJson<{ location: { id: string } }>("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      toast.success("Location created.");
      setCreateDraft(emptyDraft);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to create location.");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveLocation(locationId: string) {
    setBusyKey(`save-${locationId}`);
    try {
      await requestJson<{ location: { id: string } }>("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          ...editingDraft,
        }),
      });
      toast.success("Location updated.");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update location.");
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleLocation(location: LocationRecord) {
    const nextIsActive = !location.isActive;
    setBusyKey(`toggle-${location.id}`);
    try {
      await requestJson<{ location: { id: string } }>("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: location.id,
          ...toDraft(location),
          isActive: nextIsActive,
        }),
      });
      toast.success(nextIsActive ? "Location activated." : "Location deactivated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update location.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card className="surface-shell">
        <CardHeader>
          <CardTitle>Add location</CardTitle>
          <CardDescription>
            Create a new active business location for transfers, storefront fulfillment, and
            location-specific reporting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationFields
            prefix="create-location"
            draft={createDraft}
            onChange={(field, value) =>
              setCreateDraft((current) => ({
                ...current,
                [field]: value,
              }))
            }
          />
          <Button
            className="w-full"
            disabled={busyKey === "create"}
            onClick={() => void createLocation()}
          >
            {busyKey === "create" ? "Creating..." : "Create location"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {locations.map((location) => {
          const isEditing = editingId === location.id;
          return (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>{location.name}</span>
                      <Badge variant={location.isActive ? "success" : "outline"}>
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {location.city}, {location.provinceOrState} {location.postalCode}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingDraft(emptyDraft);
                        }}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(location.id);
                          setEditingDraft(toDraft(location));
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant={location.isActive ? "outline" : "secondary"}
                      disabled={
                        busyKey === `toggle-${location.id}` ||
                        (location.isActive && activeCount <= 1)
                      }
                      onClick={() => void toggleLocation(location)}
                    >
                      {busyKey === `toggle-${location.id}`
                        ? "Updating..."
                        : location.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <LocationFields
                      prefix={`edit-location-${location.id}`}
                      draft={editingDraft}
                      onChange={(field, value) =>
                        setEditingDraft((current) => ({
                          ...current,
                          [field]: value,
                        }))
                      }
                    />
                    <Button
                      className="w-full"
                      disabled={busyKey === `save-${location.id}`}
                      onClick={() => void saveLocation(location.id)}
                    >
                      {busyKey === `save-${location.id}` ? "Saving..." : "Save changes"}
                    </Button>
                  </>
                ) : (
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div>
                      <div className="font-medium text-foreground">Address</div>
                      <div>{location.addressLine1}</div>
                      {location.addressLine2 ? <div>{location.addressLine2}</div> : null}
                      <div>
                        {location.city}, {location.provinceOrState} {location.postalCode}
                      </div>
                      <div>{location.country}</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Timezone</div>
                      <div>{location.timezone ?? "Business default"}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
