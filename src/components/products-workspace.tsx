"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Barcode, MailWarning, SearchSlash } from "lucide-react";

import { InventoryAdjustmentForm } from "@/components/forms/inventory-adjustment-form";
import { InventoryTransferForm } from "@/components/forms/inventory-transfer-form";
import { ProductForm } from "@/components/forms/product-form";
import { ProductsTable } from "@/components/products-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  availableQuantity: number;
  reorderQuantity: number;
  supplierName: string;
};

function normalizeBarcode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function ProductsWorkspace({
  locationId,
  locationName,
  locations,
  rows,
  supplierOptions,
  productOptions,
  emailVerified = true,
}: {
  locationId: string;
  locationName: string;
  locations: Array<{ id: string; name: string }>;
  rows: ProductRow[];
  supplierOptions: Array<{ id: string; name: string; label: string }>;
  productOptions: Array<{ id: string; name: string; label: string }>;
  emailVerified?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [prefilledBarcode, setPrefilledBarcode] = useState<string | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const barcodeMap = useMemo(
    () =>
      new Map(
        rows
          .filter((row) => row.barcode.trim().length > 0)
          .map((row) => [normalizeBarcode(row.barcode), row])
      ),
    [rows]
  );

  useEffect(() => {
    function resetBuffer() {
      bufferRef.current = "";
      lastKeyAtRef.current = 0;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function commitBuffer() {
      const value = normalizeBarcode(bufferRef.current);
      resetBuffer();

      if (value.length < 6) {
        return;
      }

      setLastScannedBarcode(value);
      const matchedProduct = barcodeMap.get(value);

      if (matchedProduct) {
        setSearchQuery(value);
        setHighlightedProductId(matchedProduct.id);
        setPrefilledBarcode(null);
        return;
      }

      setSearchQuery(value);
      setHighlightedProductId(null);
      setPrefilledBarcode(value);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        if (bufferRef.current) {
          commitBuffer();
        }
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      const now = window.performance.now();
      if (now - lastKeyAtRef.current > 80) {
        bufferRef.current = event.key;
      } else {
        bufferRef.current += event.key;
      }
      lastKeyAtRef.current = now;

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(commitBuffer, 120);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resetBuffer();
    };
  }, [barcodeMap]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6 animate-fade-in-up stagger-1">
        <Card className="gradient-panel border-primary/15">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Barcode className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Barcode-ready catalog</CardTitle>
                <CardDescription>
                  Scan a barcode on the products page. Matching items are highlighted; new codes
                  prefill the add-product form for {locationName}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-primary">
              HID / keyboard-wedge supported
            </span>
            <span>Last scan: {lastScannedBarcode ?? "Waiting for scanner input"}</span>
            {highlightedProductId ? (
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-green-700">
                Existing product found
              </span>
            ) : lastScannedBarcode ? (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700">
                Ready to create a new product
              </span>
            ) : null}
          </CardContent>
        </Card>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
              <SearchSlash className="size-8" />
              <div>
                <div className="font-medium text-foreground">No products yet</div>
                <p className="mt-1 text-sm">
                  Create the first product on the right to begin tracking inventory and checkout
                  availability.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProductsTable
            data={rows}
            searchQuery={searchQuery}
            onSearchQueryChange={(value) => {
              setSearchQuery(value);
              if (!value.trim()) {
                setHighlightedProductId(null);
              }
            }}
            highlightedProductId={highlightedProductId}
          />
        )}
      </div>

      <div className="space-y-6 animate-fade-in-up stagger-2">
        {!emailVerified ? (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="flex items-start gap-3 p-5">
              <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-amber-900">
                  Email verification required
                </div>
                <p className="text-sm text-amber-800">
                  Please verify your email address before creating products. Check your inbox for
                  the verification link.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProductForm
            locationId={locationId}
            suppliers={supplierOptions}
            presetBarcode={prefilledBarcode}
          />
        )}
        <InventoryAdjustmentForm
          key={`adjustment-${locationId}`}
          locationId={locationId}
          products={productOptions}
        />
        <InventoryTransferForm
          key={`transfer-${locationId}`}
          sourceLocationId={locationId}
          locations={locations}
          productOptions={productOptions}
        />
      </div>
    </div>
  );
}
