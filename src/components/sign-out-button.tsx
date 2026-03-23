"use client";

import { useState } from "react";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export function SignOutButton({
  variant = "light",
  className,
  redirectTo = "/sign-in",
}: {
  variant?: "dark" | "light";
  className?: string;
  redirectTo?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button
      className={cn(className ?? "w-full", variant === "dark" && "text-white/60 hover:text-white")}
      disabled={isSubmitting}
      variant="outline"
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await requestJson<{ success: boolean }>("/api/auth/sign-out", { method: "POST" });
          window.location.replace(redirectTo);
        } catch (error) {
          if (error instanceof ApiClientError) {
            toast.error(error.message);
          } else {
            toast.error("Unable to sign out.");
          }
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}
