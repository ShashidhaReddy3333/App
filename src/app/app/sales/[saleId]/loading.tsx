import { PageSkeleton } from "@/components/page-skeleton";

export default function SaleDetailLoading() {
  return <PageSkeleton cards={2} columns="xl:grid-cols-[1.1fr_0.9fr]" />;
}
