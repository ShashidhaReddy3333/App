import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageSkeleton({
  cards = 4,
  columns = "md:grid-cols-2 xl:grid-cols-4"
}: {
  cards?: number;
  columns?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-96 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className={`grid gap-4 ${columns}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="gradient-panel">
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded-xl bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
