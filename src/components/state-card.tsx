import { AlertTriangle, FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="gradient-panel">
      <CardHeader>
        <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileQuestion className="size-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  onRetryLabel = "Try again"
}: {
  title: string;
  description: string;
  onRetryLabel?: string;
}) {
  return (
    <Card className="gradient-panel border-destructive/30">
      <CardHeader>
        <div className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="">
          <Button type="submit" variant="outline">
            {onRetryLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
