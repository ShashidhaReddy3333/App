import { AlertTriangle, FileQuestion, Inbox, PackageOpen, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const emptyIcons = {
  default: FileQuestion,
  cart: ShoppingCart,
  inbox: Inbox,
  package: PackageOpen
} as const;

export function EmptyState({
  title,
  description,
  action,
  icon = "default"
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: keyof typeof emptyIcons;
}) {
  const Icon = emptyIcons[icon];
  return (
    <Card className="gradient-panel animate-fade-in-up">
      <CardHeader className="items-center text-center">
        <div className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-md">{description}</CardDescription>
      </CardHeader>
      {action ? <CardContent className="flex justify-center">{action}</CardContent> : null}
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
    <Card className="gradient-panel border-destructive/30 animate-fade-in-up">
      <CardHeader className="items-center text-center">
        <div className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-md">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <form action="">
          <Button type="submit" variant="outline">
            {onRetryLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
