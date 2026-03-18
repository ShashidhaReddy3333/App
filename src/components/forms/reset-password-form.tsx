"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      password: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ ok: boolean }>("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      toast.success("Password updated.");
      router.push("/sign-in");
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to reset password.");
      toast.error("Unable to reset password.");
    }
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Use the one-time token to set a new password. New passwords must be at least 8 characters long.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.email ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.email.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input id="token" {...form.register("token")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.token ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.token.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.password ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.password.message}</p> : null}
            </div>
          </div>
          {serverError ? <p className="text-sm text-destructive" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
