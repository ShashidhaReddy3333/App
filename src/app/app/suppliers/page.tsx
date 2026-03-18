import type { Metadata } from "next";
import { SupplierForm } from "@/components/forms/supplier-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";

export const metadata: Metadata = {
  title: "Suppliers | Human Pulse",
};

export default async function SuppliersPage() {
  const session = await requirePermission("suppliers");
  const { suppliers } = await listCatalogData(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier contacts used for reorder grouping and purchase planning."
        breadcrumbs={[{ label: "Suppliers" }]}
      />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SupplierForm />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {suppliers.length === 0 ? (
            <EmptyState title="No suppliers yet" description="Add a supplier to support reorder grouping and purchase planning." />
          ) : null}
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="transition-all duration-200 hover:shadow-md">
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
      </div>
    </div>
  );
}


