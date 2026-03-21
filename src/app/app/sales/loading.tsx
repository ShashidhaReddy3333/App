import { PageSkeleton } from "@/components/page-skeleton";

export default function SalesLoading() {
  return <PageSkeleton cards={4} columns="xl:grid-cols-[0.9fr_1.1fr]" />;
}
