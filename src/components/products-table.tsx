"use client";

import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

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

function matchesProduct(row: ProductRow, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [row.name, row.category, row.sku, row.barcode, row.supplierName].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  );
}

export function ProductsTable({
  data,
  searchQuery,
  onSearchQueryChange,
  highlightedProductId,
}: {
  data: ProductRow[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  highlightedProductId?: string | null;
}) {
  const filtered = data.filter((row) => matchesProduct(row, searchQuery));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search by name, SKU, barcode, or supplier..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full max-w-xl pl-9"
          aria-label="Search products"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Barcode</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Available</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Reorder</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No products match the current search.
                  </td>
                </tr>
              ) : null}
              {filtered.map((row) => {
                const isHighlighted = row.id === highlightedProductId;
                return (
                  <tr
                    key={row.id}
                    className={
                      isHighlighted
                        ? "bg-primary/[0.08] transition-colors"
                        : "transition-colors hover:bg-muted/30"
                    }
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.sku}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.barcode || "Not set"}</td>
                    <td className="px-4 py-3">{formatCurrency(row.sellingPrice)}</td>
                    <td className="px-4 py-3">{row.availableQuantity}</td>
                    <td className="px-4 py-3">
                      {row.reorderQuantity > 0 ? (
                        <Badge variant="warning">{row.reorderQuantity}</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.supplierName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
