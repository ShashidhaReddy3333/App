import { PageSkeleton } from "@/components/page-skeleton";

export default function SupplierCatalogLoading() {
  return <PageSkeleton cards={4} columns="md:grid-cols-2 xl:grid-cols-4" />;
}
