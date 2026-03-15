import { SupplierForm } from "@/components/forms/supplier-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";

export default async function SuppliersPage() {
  const session = await requirePermission("products");
  const { suppliers } = await listCatalogData(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage supplier contacts used for reorder grouping and purchase planning." />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SupplierForm />
        <div className="grid gap-4 md:grid-cols-2">
          {suppliers.length === 0 ? (
            <EmptyState title="No suppliers yet" description="Add a supplier to support reorder grouping and purchase planning." />
          ) : null}
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="gradient-panel">
              <CardHeader>
                <CardTitle>{supplier.name}</CardTitle>
                <CardDescription>{supplier.contactName || "No contact specified"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>{supplier.email || "No email"}</div>
                <div>{supplier.phone || "No phone"}</div>
                <div>{supplier.notes || "No notes"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
