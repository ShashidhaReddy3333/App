"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { signUpSchema } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof signUpSchema>;

const defaultValues: Values = {
  ownerName: "",
  email: "",
  password: "",
  businessName: "",
  businessType: "retail_store",
  primaryCountry: "CA",
  timezone: "America/Toronto",
  currency: "CAD",
  taxMode: "exclusive_tax",
  addressLine1: "",
  city: "",
  provinceOrState: "",
  postalCode: "",
  defaultTaxName: "HST",
  defaultTaxRate: 13
};

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ businessId: string }>("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      toast.success("Business created.");
      window.location.replace("/app/dashboard");
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create business.");
      toast.error("Unable to create business.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Create business</CardTitle>
        <CardDescription>Set up the owner account, business profile, default location, and initial tax rule.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" {...form.register("ownerName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Owner email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" {...form.register("businessName")} />
            {form.formState.errors.businessName ? <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessType">Business type</Label>
            <Input id="businessType" placeholder="retail_store" {...form.register("businessType")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxMode">Tax mode</Label>
            <Input id="taxMode" placeholder="exclusive_tax" {...form.register("taxMode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...form.register("currency")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...form.register("timezone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" {...form.register("addressLine1")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provinceOrState">Province / state</Label>
            <Input id="provinceOrState" {...form.register("provinceOrState")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" {...form.register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTaxName">Default tax name</Label>
            <Input id="defaultTaxName" {...form.register("defaultTaxName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default tax rate</Label>
            <Input id="defaultTaxRate" type="number" step="0.01" {...form.register("defaultTaxRate", { valueAsNumber: true })} />
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating business..." : "Create business"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
