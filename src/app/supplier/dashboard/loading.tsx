import { PageSkeleton } from "@/components/page-skeleton";

export default function SupplierDashboardLoading() {
  return <PageSkeleton cards={6} columns="md:grid-cols-2 xl:grid-cols-3" />;
}
