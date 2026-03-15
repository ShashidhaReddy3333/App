import { PageSkeleton } from "@/components/page-skeleton";

export default function CheckoutLoading() {
  return <PageSkeleton cards={2} columns="xl:grid-cols-[1.05fr_0.95fr]" />;
}
