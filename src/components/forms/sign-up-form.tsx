"use client";

import { useState } from "react";
import { Clock3, CreditCard, ImageIcon, MapPin, ReceiptText, Store } from "lucide-react";
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
  defaultTaxRate: 13,
};

const STEP_FIELDS: Array<Array<keyof Values>> = [
  ["ownerName", "email", "password"],
  ["businessName", "businessType", "primaryCountry", "timezone", "currency", "taxMode"],
  ["addressLine1", "city", "provinceOrState", "postalCode", "defaultTaxName", "defaultTaxRate"],
];

const NEXT_SETUP_CARDS = [
  {
    title: "Brand and logo",
    description: "Add storefront identity and business profile details from settings after launch.",
    icon: ImageIcon,
  },
  {
    title: "Store hours",
    description:
      "Publish opening hours and customer-facing availability once the location is live.",
    icon: Clock3,
  },
  {
    title: "Payments",
    description:
      "Connect payment rails and review receipts, taxes, and operational defaults after setup.",
    icon: CreditCard,
  },
] as const;

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ businessId: string; redirectTo: string }>(
        "/api/auth/sign-up",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      toast.success("Business created.");
      window.location.replace(payload.redirectTo);
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

  const nextStep = async () => {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) {
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_FIELDS.length - 1));
  };

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Create business</CardTitle>
        <CardDescription>
          Set up the owner account, business profile, default location, and initial tax rule.
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
                <h2 className="text-lg font-semibold">Owner account</h2>
                <p className="text-sm text-muted-foreground">
                  Create the primary owner login for this business.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner name</Label>
                <Input id="ownerName" {...form.register("ownerName")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.ownerName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.ownerName.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Owner email</Label>
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
                  Tell us how your business operates so the platform can be configured correctly.
                </p>
              </div>
              <div className="rounded-[24px] border border-border/30 bg-[hsl(var(--surface-lowest))]/90 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Business setup preview
                    </div>
                    <div className="text-base font-semibold">What launches with this account</div>
                    <p className="max-w-xl text-sm text-muted-foreground">
                      We&apos;ll use these defaults to prepare your first dashboard, storefront tax
                      behavior, and operational workspace.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/25 bg-[hsl(var(--surface-low))] px-3 py-2.5 text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Business
                      </div>
                      <div className="mt-1 font-medium">
                        {form.watch("businessName") || "Your business name"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/25 bg-[hsl(var(--surface-low))] px-3 py-2.5 text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Tax behavior
                      </div>
                      <div className="mt-1 font-medium">
                        {form.watch("taxMode").replaceAll("_", " ")}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/25 bg-[hsl(var(--surface-low))] px-3 py-2.5 text-sm">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Currency
                      </div>
                      <div className="mt-1 font-medium">{form.watch("currency") || "CAD"}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
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
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.businessType ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.businessType.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryCountry">Primary country</Label>
                <Input id="primaryCountry" {...form.register("primaryCountry")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.primaryCountry ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.primaryCountry.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" {...form.register("timezone")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.timezone ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.timezone.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...form.register("currency")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.currency ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.currency.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxMode">Tax mode</Label>
                <Select id="taxMode" {...form.register("taxMode")}>
                  <option value="exclusive_tax">exclusive tax</option>
                  <option value="inclusive_tax">inclusive tax</option>
                  <option value="no_tax">no tax</option>
                </Select>
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.taxMode ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.taxMode.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <h2 className="text-lg font-semibold">Location and default tax</h2>
                <p className="text-sm text-muted-foreground">
                  Add the first business location and the default tax rule for new sales.
                </p>
              </div>
              <div className="rounded-[24px] border border-primary/12 bg-primary/[0.05] p-4 md:col-span-2">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-2">
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Launch snapshot
                    </div>
                    <div className="text-base font-semibold">
                      Your first store opens with these defaults
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This location becomes your primary operating space for checkout, staff
                      workflows, receipts, and tax calculations.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Storefront</span>
                      </div>
                      <div className="mt-2 font-medium">
                        {form.watch("businessName") || "New business"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Location</span>
                      </div>
                      <div className="mt-2 font-medium">{form.watch("city") || "Primary city"}</div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-3 py-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ReceiptText className="size-4" />
                        <span className="text-xs uppercase tracking-[0.16em]">Tax mode</span>
                      </div>
                      <div className="mt-2 font-medium">
                        {form.watch("taxMode").replaceAll("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address</Label>
                <Input id="addressLine1" {...form.register("addressLine1")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.addressLine1 ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.addressLine1.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.city ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.city.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provinceOrState">Province / state</Label>
                <Input id="provinceOrState" {...form.register("provinceOrState")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.provinceOrState ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.provinceOrState.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input id="postalCode" {...form.register("postalCode")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.postalCode ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.postalCode.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTaxName">Default tax name</Label>
                <Input id="defaultTaxName" {...form.register("defaultTaxName")} />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.defaultTaxName ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.defaultTaxName.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">Default tax rate</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  step="0.01"
                  {...form.register("defaultTaxRate", { valueAsNumber: true })}
                />
                <div aria-live="polite" aria-atomic="true">
                  {form.formState.errors.defaultTaxRate ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.defaultTaxRate.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[24px] border border-border/30 bg-[hsl(var(--surface-lowest))]/90 p-4 md:col-span-2">
                <div className="space-y-3">
                  <div>
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Configure next after launch
                    </div>
                    <div className="mt-1 text-base font-semibold">
                      Finish the business profile without blocking account creation
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {NEXT_SETUP_CARDS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="rounded-[20px] border border-border/25 bg-[hsl(var(--surface-low))] px-4 py-4"
                        >
                          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-[18px]" />
                          </div>
                          <div className="mt-3 text-sm font-semibold">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                {form.formState.isSubmitting ? "Creating business..." : "Create business"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
