import { AlertTriangle, FileQuestion, Inbox, PackageOpen, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const emptyIcons = {
  default: FileQuestion,
  cart: ShoppingCart,
  inbox: Inbox,
  package: PackageOpen,
} as const;

const illustrationVariants = {
  inventory: InventoryIllustration,
  receipt: ReceiptIllustration,
  order: OrderIllustration,
  inbox: InboxIllustration,
} as const;

export function EmptyState({
  title,
  description,
  action,
  icon = "default",
  illustration,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: keyof typeof emptyIcons;
  illustration?: keyof typeof illustrationVariants;
}) {
  const Icon = emptyIcons[icon];
  const Illustration = illustration ? illustrationVariants[illustration] : null;
  return (
    <Card className="border-dashed bg-[hsl(var(--surface-lowest)_/_0.9)]">
      <CardHeader className="items-center text-center">
        {Illustration ? (
          <div className="mb-4 flex justify-center">
            <Illustration />
          </div>
        ) : (
          <div className="mb-3 inline-flex rounded-full bg-[hsl(var(--surface-high))] p-3 text-muted-foreground">
            <Icon className="size-6" />
          </div>
        )}
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
  onRetryLabel = "Try again",
  onRetry,
}: {
  title: string;
  description: string;
  onRetryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-dashed bg-[hsl(var(--surface-lowest)_/_0.9)]">
      <CardHeader className="items-center text-center">
        <div className="mb-3 inline-flex rounded-full bg-red-50 p-3 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-md">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            {onRetryLabel}
          </Button>
        ) : (
          <form action="">
            <Button type="submit">{onRetryLabel}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function InventoryIllustration() {
  return (
    <svg viewBox="0 0 180 128" aria-hidden="true" className="h-32 w-44">
      <rect x="18" y="32" width="144" height="82" rx="26" fill="hsl(var(--surface-low))" />
      <path
        d="M52 48h76l14 17v29a10 10 0 0 1-10 10H48A10 10 0 0 1 38 94V65l14-17Z"
        fill="white"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <path
        d="M52 48 90 70l38-22"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M90 70v34"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="72" y="22" width="36" height="8" rx="4" fill="hsl(var(--primary) / 0.22)" />
      <circle cx="138" cy="34" r="12" fill="hsl(var(--primary) / 0.12)" />
    </svg>
  );
}

function ReceiptIllustration() {
  return (
    <svg viewBox="0 0 180 128" aria-hidden="true" className="h-32 w-44">
      <rect x="28" y="14" width="124" height="100" rx="22" fill="hsl(var(--surface-low))" />
      <path
        d="M52 24h76a8 8 0 0 1 8 8v68l-10-6-10 6-10-6-10 6-10-6-10 6-10-6-10 6V32a8 8 0 0 1 8-8Z"
        fill="white"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <path d="M66 46h48" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 60h38" stroke="hsl(var(--border))" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 74h48" stroke="hsl(var(--border))" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 88h30" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      <circle cx="126" cy="88" r="10" fill="hsl(var(--primary) / 0.14)" />
    </svg>
  );
}

function OrderIllustration() {
  return (
    <svg viewBox="0 0 180 128" aria-hidden="true" className="h-32 w-44">
      <rect x="18" y="28" width="144" height="84" rx="26" fill="hsl(var(--surface-low))" />
      <rect
        x="40"
        y="40"
        width="100"
        height="60"
        rx="20"
        fill="white"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <path d="M58 58h64" stroke="hsl(var(--border))" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 72h46" stroke="hsl(var(--border))" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M116 76l9 9 18-22"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="34" r="10" fill="hsl(var(--primary) / 0.12)" />
    </svg>
  );
}

function InboxIllustration() {
  return (
    <svg viewBox="0 0 180 128" aria-hidden="true" className="h-32 w-44">
      <rect x="16" y="24" width="148" height="88" rx="28" fill="hsl(var(--surface-low))" />
      <path
        d="M42 52h96l10 16v22a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V68l10-16Z"
        fill="white"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <path
        d="M52 68h26l8 12h28l8-12h26"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="124" cy="40" r="12" fill="hsl(var(--primary) / 0.14)" />
      <circle cx="124" cy="40" r="5" fill="hsl(var(--primary))" />
    </svg>
  );
}
