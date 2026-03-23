import { PageSkeleton } from "@/components/page-skeleton";

export default function SessionsLoading() {
  return <PageSkeleton cards={3} columns="grid-cols-1" />;
}
