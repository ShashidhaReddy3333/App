"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { supplierSignUpSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof supplierSignUpSchema>;

export function SupplierSignUpForm({
  authPath = "/api/auth/supplier/sign-up",
}: {
  authPath?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(supplierSignUpSchema),
    defaultValues: {
      fullName: "",
      businessName: "",
      email: "",
      password: "",
      phone: "",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      const payload = await requestJson<{ redirectTo: string }>(authPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success("Supplier access request submitted.");
      setSuccessMessage(
        "Your supplier access request has been submitted. We will review the details before activating a supplier portal account."
      );
      window.location.replace(payload.redirectTo);
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to submit the supplier access request.");
      toast.error("Unable to submit the supplier access request.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Request supplier access</CardTitle>
        <CardDescription>
          Submit your business details to request access to the Human Pulse supplier portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Contact name</Label>
            <Input id="fullName" {...form.register("fullName")} />
            {form.formState.errors.fullName ? (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Supplier business</Label>
            <Input id="businessName" {...form.register("businessName")} />
            {form.formState.errors.businessName ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.businessName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone ? (
              <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            <p className="text-xs text-muted-foreground">
              Must be at least 10 characters with uppercase, lowercase, and a digit.
            </p>
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Business notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          {successMessage ? (
            <p className="text-sm text-primary md:col-span-2">{successMessage}</p>
          ) : null}
          {serverError ? (
            <p className="text-sm text-destructive md:col-span-2">{serverError}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Request supplier access"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
