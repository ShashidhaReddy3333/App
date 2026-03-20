import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BusinessProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-48 w-full" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="-mt-16 relative z-10 mb-6 flex items-end gap-4">
          <Skeleton className="h-24 w-24 rounded-xl" />
          <div className="pb-2 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardHeader><Skeleton className="h-5 w-20" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
          </div>
          <div>
            <Card><CardHeader><Skeleton className="h-5 w-28" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
