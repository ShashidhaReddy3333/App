"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState
} from "@tanstack/react-table";
import { ArrowUpDown, Search } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/state-card";

export function DataTable<TData>({ columns, data, emptyTitle, emptyDescription, searchPlaceholder, searchColumn }: {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchColumn?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters }
  });

  if (data.length === 0 && emptyTitle) {
    return <EmptyState title={emptyTitle} description={emptyDescription ?? "No data to display."} />;
  }

  return (
    <div className="space-y-4">
      {searchPlaceholder && searchColumn ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchColumn)?.setFilterValue(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
          />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-3xl border bg-white shadow-panel animate-fade-in">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() ? (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
