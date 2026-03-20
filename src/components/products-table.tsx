"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  sku: string;
  sellingPrice: number;
  availableQuantity: number;
  reorderQuantity: number;
  supplierName: string;
};

const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: "Product"
  },
  {
    accessorKey: "category",
    header: "Category"
  },
  {
    accessorKey: "sku",
    header: "SKU"
  },
  {
    accessorKey: "sellingPrice",
    header: "Price",
    cell: ({ row }) => formatCurrency(row.original.sellingPrice)
  },
  {
    accessorKey: "availableQuantity",
    header: "Available"
  },
  {
    accessorKey: "reorderQuantity",
    header: "Reorder",
    cell: ({ row }) =>
      row.original.reorderQuantity > 0 ? <Badge variant="warning">{row.original.reorderQuantity}</Badge> : <Badge variant="success">OK</Badge>
  },
  {
    accessorKey: "supplierName",
    header: "Supplier"
  }
];

export function ProductsTable({ data }: { data: ProductRow[] }) {
  return <DataTable columns={columns} data={data} searchColumn="name" searchPlaceholder="Search products..." />;
}
