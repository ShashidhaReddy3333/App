import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-primary-foreground shadow-panel hover:brightness-[1.03] hover:shadow-panel-hover",
        secondary:
          "bg-[hsl(var(--surface-high))] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] hover:bg-[hsl(var(--surface-strong))]",
        ghost: "text-muted-foreground hover:bg-[hsl(var(--surface-low))] hover:text-foreground",
        outline:
          "border border-border/40 bg-[hsl(var(--surface-lowest)_/_0.9)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-primary/20 hover:bg-[hsl(var(--surface-low))]",
        destructive:
          "bg-destructive text-white shadow-panel hover:brightness-95 hover:shadow-panel-hover",
        "uber-green":
          "bg-[linear-gradient(135deg,#008378,#00a196)] text-white shadow-panel hover:brightness-[1.03] hover:shadow-panel-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[10px] px-3",
        lg: "h-11 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
