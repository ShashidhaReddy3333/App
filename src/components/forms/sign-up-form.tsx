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
import { Select } from "@/components/ui/select";
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
        <CardDescription>Set up the owner account, business profile, default location, and initial tax rule. Passwords must be at least 8 characters long.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" {...form.register("ownerName")} />
            {form.formState.errors.ownerName ? <p className="text-sm text-destructive">{form.formState.errors.ownerName.message}</p> : null}
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
            <Select id="businessType" {...form.register("businessType")}>
              <option value="retail_store">retail store</option>
              <option value="grocery">grocery</option>
              <option value="clothing">clothing</option>
              <option value="pharmacy">pharmacy</option>
              <option value="convenience">convenience</option>
              <option value="online_seller">online seller</option>
              <option value="wholesale">wholesale</option>
              <option value="service_with_products">service with products</option>
            </Select>
            {form.formState.errors.businessType ? <p className="text-sm text-destructive">{form.formState.errors.businessType.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxMode">Tax mode</Label>
            <Select id="taxMode" {...form.register("taxMode")}>
              <option value="exclusive_tax">exclusive tax</option>
              <option value="inclusive_tax">inclusive tax</option>
              <option value="no_tax">no tax</option>
            </Select>
            {form.formState.errors.taxMode ? <p className="text-sm text-destructive">{form.formState.errors.taxMode.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...form.register("currency")} />
            {form.formState.errors.currency ? <p className="text-sm text-destructive">{form.formState.errors.currency.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...form.register("timezone")} />
            {form.formState.errors.timezone ? <p className="text-sm text-destructive">{form.formState.errors.timezone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" {...form.register("addressLine1")} />
            {form.formState.errors.addressLine1 ? <p className="text-sm text-destructive">{form.formState.errors.addressLine1.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register("city")} />
            {form.formState.errors.city ? <p className="text-sm text-destructive">{form.formState.errors.city.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="provinceOrState">Province / state</Label>
            <Input id="provinceOrState" {...form.register("provinceOrState")} />
            {form.formState.errors.provinceOrState ? <p className="text-sm text-destructive">{form.formState.errors.provinceOrState.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" {...form.register("postalCode")} />
            {form.formState.errors.postalCode ? <p className="text-sm text-destructive">{form.formState.errors.postalCode.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTaxName">Default tax name</Label>
            <Input id="defaultTaxName" {...form.register("defaultTaxName")} />
            {form.formState.errors.defaultTaxName ? <p className="text-sm text-destructive">{form.formState.errors.defaultTaxName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default tax rate</Label>
            <Input id="defaultTaxRate" type="number" step="0.01" {...form.register("defaultTaxRate", { valueAsNumber: true })} />
            {form.formState.errors.defaultTaxRate ? <p className="text-sm text-destructive">{form.formState.errors.defaultTaxRate.message}</p> : null}
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
