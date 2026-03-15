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
  const form = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ ok: boolean; devToken: string | null }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      setDevToken(payload.devToken ?? null);
      toast.success("If the account exists, a reset link is ready.");
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
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Generate a one-time reset token for the owner or staff account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {devToken ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            Demo reset token: <span className="font-mono">{devToken}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
