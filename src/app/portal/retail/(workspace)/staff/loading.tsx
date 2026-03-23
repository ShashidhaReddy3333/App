import { PageSkeleton } from "@/components/page-skeleton";

export default function StaffLoading() {
  return <PageSkeleton cards={3} columns="xl:grid-cols-[0.8fr_1.2fr]" />;
}
