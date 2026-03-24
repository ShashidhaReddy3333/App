"use client";

import { useState } from "react";
import { Building2, FileText, Phone } from "lucide-react";
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

const STEP_FIELDS: Array<Array<keyof Values>> = [
  ["fullName", "email", "password"],
  ["businessName", "phone"],
];

export function SupplierSignUpForm({
  authPath = "/api/auth/supplier/sign-up",
}: {
  authPath?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
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
    try {
      const payload = await requestJson<{ redirectTo: string }>(authPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success("Supplier access request submitted.");
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

  const nextStep = async () => {
    const valid = await form.trigger(STEP_FIELDS[step] as Array<keyof Values>, {
      shouldFocus: true,
    });
    if (!valid) return;
    setStep((current) => Math.min(current + 1, STEP_FIELDS.length - 1));
  };

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Request supplier access</CardTitle>
        <CardDescription>
          Submit your business details to request access to the Human Pulse supplier portal.
        </CardDescription>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span>Step {step + 1}</span>
            <span>{STEP_FIELDS.length} total</span>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${((step + 1) / STEP_FIELDS.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          {step === 0 ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <h2 className="text-lg font-semibold">Contact account</h2>
                <p className="text-sm text-muted-foreground">
                  Create the login credentials for your supplier account.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Contact name</Label>
                <Input id="fullName" {...form.register("fullName")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.fullName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.fullName.message}
                    </p>
                  ) : null}
                </div>
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
                <p className="text-xs text-muted-foreground">
                  Must be at least 10 characters and include uppercase, lowercase, and a digit.
                </p>
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.password ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <h2 className="text-lg font-semibold">Business details</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us about your supplier business so we can review and activate your portal
                  access.
                </p>
              </div>
              <div className="rounded-[24px] border border-primary/12 bg-primary/[0.05] p-4 md:col-span-2">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-2">
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Supplier preview
                    </div>
                    <div className="text-base font-semibold">
                      Your request will include these details
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews each supplier application before activating portal access.
                      Make sure your business name and contact details are accurate.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Business</span>
                      </div>
                      <div className="mt-2 font-medium truncate">
                        {form.watch("businessName") || "Your business"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Phone</span>
                      </div>
                      <div className="mt-2 font-medium truncate">
                        {form.watch("phone") || "Not provided"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Notes</span>
                      </div>
                      <div className="mt-2 font-medium truncate">
                        {form.watch("notes") ? "Included" : "None"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Supplier business name</Label>
                <Input id="businessName" {...form.register("businessName")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.businessName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.businessName.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.phone ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.phone.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Business notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe the types of products you supply, your distribution area, or anything else we should know."
                  {...form.register("notes")}
                />
              </div>
            </>
          ) : null}

          {serverError ? (
            <p
              className="text-sm text-destructive md:col-span-2"
              aria-live="polite"
              aria-atomic="true"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}

          <div className="flex gap-3 md:col-span-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            ) : null}
            {step < STEP_FIELDS.length - 1 ? (
              <Button type="button" className="flex-1" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Submitting request..." : "Request supplier access"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
