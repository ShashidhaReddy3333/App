"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Mail } from "lucide-react";

import { requestJson, ApiClientError } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await requestJson("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setSent(true);
      toast.success("Verification email sent. Check your inbox.");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to send verification email. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 text-sm text-amber-800">
          <span className="font-medium">Please verify your email address.</span>{" "}
          Check your inbox for a verification link.
        </div>
        {sent ? (
          <div className="flex items-center gap-1.5 text-sm text-amber-700">
            <Mail className="h-4 w-4" />
            <span>Email sent</span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend verification"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
