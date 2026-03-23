"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { downloadCsv } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type ExportType = "sales" | "products" | "suppliers";

function buildFilename(type: ExportType) {
  return `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function ReportsExportPanel({
  currentLocationId,
  currentLocationName,
  locations,
}: {
  currentLocationId: string;
  currentLocationName: string;
  locations: Array<{ id: string; name: string }>;
}) {
  const [type, setType] = useState<ExportType>("sales");
  const [locationId, setLocationId] = useState(currentLocationId);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const shouldShowDateRange = type === "sales";
  const shouldShowLocation = type !== "suppliers";
  const locationLabel = useMemo(() => {
    if (type === "sales") {
      return "All active locations";
    }
    return `Current location (${currentLocationName})`;
  }, [currentLocationName, type]);

  async function handleExport() {
    if (shouldShowDateRange && Boolean(dateFrom) !== Boolean(dateTo)) {
      toast.error("Choose both a start and end date for sales exports.");
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      if (shouldShowLocation && locationId) {
        params.set("locationId", locationId);
      }
      if (shouldShowDateRange) {
        if (dateFrom) {
          params.set("dateFrom", dateFrom);
        }
        if (dateTo) {
          params.set("dateTo", dateTo);
        }
      }

      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to export report.");
      }

      const csv = await response.text();
      downloadCsv(buildFilename(type), csv);
      toast.success("Report exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export report.");
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    if (type === "suppliers") {
      setLocationId(currentLocationId);
    }

    if (type === "products" && !locationId) {
      setLocationId(currentLocationId);
    }
  }, [currentLocationId, locationId, type]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export data</CardTitle>
        <CardDescription>
          Choose the dataset, scope, and date range before downloading CSV output.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="report-export-type">Dataset</Label>
          <Select
            id="report-export-type"
            value={type}
            onChange={(event) => setType(event.target.value as ExportType)}
          >
            <option value="sales">Sales</option>
            <option value="products">Products</option>
            <option value="suppliers">Suppliers</option>
          </Select>
        </div>

        {shouldShowLocation ? (
          <div className="space-y-2">
            <Label htmlFor="report-export-location">Location</Label>
            <Select
              id="report-export-location"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              {type === "sales" ? <option value="">{locationLabel}</option> : null}
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {shouldShowDateRange ? (
          <div className="space-y-2">
            <Label htmlFor="report-export-from">Date from</Label>
            <Input
              id="report-export-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
        ) : null}

        {shouldShowDateRange ? (
          <div className="space-y-2">
            <Label htmlFor="report-export-to">Date to</Label>
            <Input
              id="report-export-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        ) : null}

        <div className="flex items-end">
          <Button className="w-full" onClick={() => void handleExport()} disabled={isExporting}>
            <Download className="mr-2 size-4" />
            {isExporting ? "Exporting..." : "Download CSV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
