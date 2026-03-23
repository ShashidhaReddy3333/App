"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { buildLocationPreferenceCookie } from "@/lib/location-preferences";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type LocationOption = {
  id: string;
  name: string;
  isActive?: boolean;
};

export function LocationSwitcher({
  label = "Location",
  cookieName,
  locations,
  value,
}: {
  label?: string;
  cookieName: string;
  locations: LocationOption[];
  value: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-w-[220px] space-y-2">
      <Label
        htmlFor={`${cookieName}-selector`}
        className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </Label>
      <Select
        id={`${cookieName}-selector`}
        value={value}
        disabled={isPending}
        onChange={(event) => {
          document.cookie = buildLocationPreferenceCookie(cookieName, event.target.value);
          startTransition(() => {
            router.refresh();
          });
        }}
      >
        {locations
          .filter((location) => location.isActive !== false)
          .map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
      </Select>
    </div>
  );
}
