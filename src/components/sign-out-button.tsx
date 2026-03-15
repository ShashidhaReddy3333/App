"use client";

import { useState } from "react";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function SignOutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button
      className="w-full"
      disabled={isSubmitting}
      variant="outline"
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await requestJson<{ success: boolean }>("/api/auth/sign-out", { method: "POST" });
          window.location.replace("/sign-in");
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
