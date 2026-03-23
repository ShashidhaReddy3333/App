import { SupplierForm } from "@/components/forms/supplier-form";
import { PageHeader } from "@/components/page-header";
import { SuppliersList } from "@/components/suppliers-list";
import { EmptyState } from "@/components/state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listCatalogData } from "@/lib/services/catalog-query-service";

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
        <div className="animate-fade-in-up stagger-1">
          <SupplierForm />
        </div>
        <div className="animate-fade-in-up stagger-2">
          {suppliers.length === 0 ? (
            <EmptyState
              title="No suppliers yet"
              description="Add a supplier to support reorder grouping and purchase planning."
            />
          ) : (
            <SuppliersList suppliers={suppliers} />
          )}
        </div>
      </div>
    </div>
  );
}
