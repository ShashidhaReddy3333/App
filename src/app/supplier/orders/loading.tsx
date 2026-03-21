import { PageSkeleton } from "@/components/page-skeleton";

export default function SupplierOrdersLoading() {
  return <PageSkeleton cards={4} columns="md:grid-cols-1 xl:grid-cols-2" />;
}
