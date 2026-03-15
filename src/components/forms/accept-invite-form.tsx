"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { acceptInviteSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof acceptInviteSchema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      fullName: "",
      password: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ userId: string }>("/api/staff/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Invite accepted.");
      window.location.replace("/app/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to accept invite.");
      toast.error("Unable to accept invite.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>Set your name and password to activate the staff account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="token">Invite token</Label>
            <Input id="token" {...form.register("token")} />
            {form.formState.errors.token ? <p className="text-sm text-destructive">{form.formState.errors.token.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...form.register("fullName")} />
            {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Activating..." : "Activate account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
