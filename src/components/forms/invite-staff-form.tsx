"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { inviteStaffSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof inviteStaffSchema>;

export function InviteStaffForm() {
  const router = useRouter();
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      email: "",
      role: "cashier"
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ invite: { id: string }; demoToken: string | null }>("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      setDemoToken(payload.demoToken ?? null);
      toast.success("Invite created.");
      form.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to send invite.");
      toast.error("Unable to send invite.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Invite staff</CardTitle>
        <CardDescription>Create a pending staff account for a manager, cashier, or inventory staff member.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" {...form.register("role")} />
            {form.formState.errors.role ? <p className="text-sm text-destructive">{form.formState.errors.role.message}</p> : null}
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Send invite"}
          </Button>
        </form>
        {demoToken ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            Demo invite token: <span className="font-mono">{demoToken}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
