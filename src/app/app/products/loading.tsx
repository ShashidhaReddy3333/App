import { PageSkeleton } from "@/components/page-skeleton";

export default function ProductsLoading() {
  return <PageSkeleton cards={3} columns="xl:grid-cols-[1.2fr_0.8fr]" />;
}
