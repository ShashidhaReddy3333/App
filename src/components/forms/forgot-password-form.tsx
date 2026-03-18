"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [devToken, setDevToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setDevToken(null);
    setServerError(null);
    setSuccessMessage(null);
    try {
      const payload = await requestJson<{ ok: boolean; devToken: string | null }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      setDevToken(payload.devToken ?? null);
      const message = payload.devToken
        ? "If the account exists, reset instructions are ready. In demo mode, use the token shown below."
        : "If the account exists, we will send reset instructions to that email address.";
      setSuccessMessage(message);
      toast.success(message);
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to start password reset.");
      toast.error("Unable to start password reset.");
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Send a password reset email in production. Demo mode shows the reset token inline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.email ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.email.message}</p> : null}
            </div>
          </div>
          {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}
          {serverError ? <p className="text-sm text-destructive" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {devToken ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary p-3 text-sm text-foreground">
            Demo reset token: <span className="font-mono">{devToken}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
