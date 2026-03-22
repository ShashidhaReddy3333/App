import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.02em] transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-primary/12 text-primary",
        secondary: "bg-[hsl(var(--surface-high))] text-foreground",
        info: "bg-sky-100 text-sky-700",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        destructive: "bg-red-100 text-red-700",
        outline: "border border-border/40 bg-[hsl(var(--surface-lowest))] text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
