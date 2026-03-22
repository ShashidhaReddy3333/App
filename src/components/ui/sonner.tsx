"use client";

import { Toaster as SonnerToaster, type ToasterProps, toast } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      toastOptions={{
        className:
          "!rounded-[18px] !border !border-border/30 !bg-[hsl(var(--surface-lowest))] !text-foreground !shadow-float",
      }}
      {...props}
    />
  );
}

export { toast };
