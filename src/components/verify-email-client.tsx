"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { requestJson, ApiClientError } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyResult = { ok: boolean; alreadyVerified?: boolean };

export function VerifyEmailClient({ email, token }: { email: string; token: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const result = await requestJson<VerifyResult>("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });

        if (cancelled) return;

        if (result.alreadyVerified) {
          setStatus("already");
        } else {
          setStatus("success");
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to verify email. Please try again.");
        }
        setStatus("error");
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [email, token]);

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
        <CardDescription>
          {status === "loading"
            ? "Verifying your email address..."
            : status === "success"
              ? "Your email has been verified."
              : status === "already"
                ? "Your email was already verified."
                : "Verification failed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Your email address has been successfully verified. You can now sign in to your account.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        )}

        {status === "already" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-600" />
              <p className="text-sm text-sky-800">
                Your email address was already verified. No further action is needed.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                {errorMessage || "The verification link is invalid or has expired."}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              If your link has expired, sign in to your account and request a new verification email.
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Go to sign in</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
