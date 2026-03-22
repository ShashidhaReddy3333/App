import { PageSkeleton } from "@/components/page-skeleton";

export default function CartLoading() {
  return <PageSkeleton cards={3} columns="lg:grid-cols-[1.1fr_0.9fr]" />;
}
