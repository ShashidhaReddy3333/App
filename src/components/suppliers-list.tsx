"use client";

import { SearchFilter } from "@/components/search-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SupplierItem = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function SuppliersList({ suppliers }: { suppliers: SupplierItem[] }) {
  return (
    <SearchFilter data={suppliers} searchKey="name" placeholder="Search suppliers...">
      {(filtered) => (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground md:col-span-2">No suppliers match your search.</p>
          ) : null}
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="gradient-panel transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle>{supplier.name}</CardTitle>
                <CardDescription>{supplier.contactName || "No contact specified"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Email</span>
                  <span>{supplier.email || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Phone</span>
                  <span>{supplier.phone || "Not set"}</span>
                </div>
                {supplier.notes ? (
                  <div className="mt-2 rounded-lg bg-muted/50 p-2 text-xs">{supplier.notes}</div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SearchFilter>
  );
}
