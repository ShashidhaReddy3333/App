import { PageSkeleton } from "@/components/page-skeleton";

export default function RootLoading() {
  return (
    <main className="page-shell py-10">
      <PageSkeleton cards={2} columns="md:grid-cols-2" />
    </main>
  );
}
