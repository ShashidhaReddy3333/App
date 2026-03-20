import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-56 mb-6" />
      <Card><CardContent className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </CardContent></Card>
    </div>
  );
}
