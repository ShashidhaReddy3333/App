"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

export function RevokeSessionButton({ sessionId, onRevoked }: { sessionId: string; onRevoked?: (sessionId: string) => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function revokeSession() {
    setIsSubmitting(true);
    try {
      await requestJson<{ session: { id: string } }>(`/api/sessions/${sessionId}/revoke`, {
        method: "POST"
      });
      toast.success("Session revoked.");
      onRevoked?.(sessionId);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to revoke session.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Revoking..." : "Revoke"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Session</AlertDialogTitle>
          <AlertDialogDescription>This will sign out the user from this device. Are you sure?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void revokeSession()} disabled={isSubmitting}>
            {isSubmitting ? "Revoking..." : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
