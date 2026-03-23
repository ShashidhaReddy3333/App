"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import type { Portal } from "@/lib/portal";
import { signInSchema } from "@/lib/schemas/auth";

type Values = z.infer<typeof signInSchema>;

export function SignInForm({
  portal,
  authPath,
  cardTitle = "Sign in",
  cardDescription = "Use your email and password to access the right Human Pulse portal for your account.",
  submitLabel = "Sign in",
}: {
  portal: Portal;
  authPath?: string;
  cardTitle?: string;
  cardDescription?: string;
  submitLabel?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const resolvedAuthPath =
        authPath ??
        (portal === "main" ? "/api/auth/retail/sign-in" : `/api/auth/${portal}/sign-in`);
      const payload = await requestJson<{ userId: string; redirectTo: string }>(resolvedAuthPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, portal }),
      });
      toast.success("Signed in.");
      window.location.replace(payload.redirectTo);
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to sign in.");
      toast.error("Unable to sign in.");
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive" role="alert">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>
          </div>
          {serverError ? (
            <p
              className="text-sm text-destructive"
              aria-live="polite"
              aria-atomic="true"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
