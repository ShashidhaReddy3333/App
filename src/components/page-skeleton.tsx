import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageSkeleton({
  cards = 4,
  columns = "md:grid-cols-2 xl:grid-cols-4"
}: {
  cards?: number;
  columns?: string;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <div className="h-4 w-40 skeleton" />
        <div className="h-9 w-56 skeleton" />
        <div className="h-5 w-96 max-w-full skeleton" />
      </div>
      <div className={`grid gap-4 ${columns}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="gradient-panel">
            <CardHeader>
              <div className="h-5 w-32 skeleton" />
              <div className="h-4 w-24 skeleton" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 w-20 skeleton" />
                <div className="h-3 w-full skeleton" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gradient-panel">
          <CardHeader>
            <div className="h-5 w-36 skeleton" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between rounded-2xl border p-3">
                <div className="h-4 w-24 skeleton" />
                <div className="h-4 w-12 skeleton" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="gradient-panel">
          <CardHeader>
            <div className="h-5 w-36 skeleton" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border p-3">
                <div className="h-4 w-32 skeleton" />
                <div className="mt-1 h-3 w-24 skeleton" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
