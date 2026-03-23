"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { customerCheckoutSchema } from "@/lib/schemas/customer-commerce";
import { supportedPaymentProviders } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof customerCheckoutSchema>;

export function CustomerCheckoutForm({
  cartTotal,
  locationId,
  locationName,
}: {
  cartTotal: number;
  locationId: string;
  locationName: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(customerCheckoutSchema),
    defaultValues: {
      locationId,
      fulfillmentType: "pickup",
      paymentMethod: "cash",
      paymentProvider: "manual",
      idempotencyKey: uuid(),
      notes: "",
    },
  });

  const fulfillmentType = form.watch("fulfillmentType");
  const paymentMethod = form.watch("paymentMethod");
  const addressLabelError = form.getFieldState("address.label", form.formState).error;
  const addressLine1Error = form.getFieldState("address.line1", form.formState).error;
  const addressLine2Error = form.getFieldState("address.line2", form.formState).error;
  const addressCityError = form.getFieldState("address.city", form.formState).error;
  const addressProvinceError = form.getFieldState("address.province", form.formState).error;
  const addressPostalCodeError = form.getFieldState("address.postalCode", form.formState).error;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ order: { id: string } }>("/api/customer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success("Order placed.");
      window.location.replace(`/orders/${payload.order.id}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to place your order.");
      toast.error("Unable to place your order.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>
          Confirm fulfillment and payment for your order of ${cartTotal.toFixed(2)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("idempotencyKey")} />
          <input type="hidden" {...form.register("locationId")} />
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Fulfilling from <span className="font-medium text-foreground">{locationName}</span>.
          </div>
          <div className="space-y-2">
            <Label htmlFor="fulfillmentType">Fulfillment</Label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  fulfillmentType === "pickup"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => form.setValue("fulfillmentType", "pickup")}
              >
                Pickup
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  fulfillmentType === "delivery"
                    ? "bg-foreground text-background"
                    : "bg-secondary text-foreground"
                }`}
                onClick={() => form.setValue("fulfillmentType", "delivery")}
              >
                Delivery
              </button>
            </div>
            <input type="hidden" {...form.register("fulfillmentType")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Select id="paymentMethod" {...form.register("paymentMethod")}>
                <option value="cash">Cash on Delivery (COD)</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="mobile_payment">Mobile Payment</option>
                <option value="bank_transfer">Bank Transfer</option>
              </Select>
            </div>
            {paymentMethod !== "cash" ? (
              <div className="space-y-2">
                <Label htmlFor="paymentProvider">Provider</Label>
                <Select id="paymentProvider" {...form.register("paymentProvider")}>
                  {supportedPaymentProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
          {fulfillmentType === "delivery" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.label">Address label</Label>
                <Input id="address.label" {...form.register("address.label")} />
                {addressLabelError ? (
                  <p className="text-sm text-destructive">{addressLabelError.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.line1">Address line 1</Label>
                <Input
                  id="address.line1"
                  aria-required={fulfillmentType === "delivery"}
                  {...form.register("address.line1")}
                />
                {addressLine1Error ? (
                  <p className="text-sm text-destructive">{addressLine1Error.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.line2">Address line 2</Label>
                <Input id="address.line2" {...form.register("address.line2")} />
                {addressLine2Error ? (
                  <p className="text-sm text-destructive">{addressLine2Error.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.city">City</Label>
                <Input id="address.city" {...form.register("address.city")} />
                {addressCityError ? (
                  <p className="text-sm text-destructive">{addressCityError.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.province">Province</Label>
                <Input id="address.province" {...form.register("address.province")} />
                {addressProvinceError ? (
                  <p className="text-sm text-destructive">{addressProvinceError.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.postalCode">Postal code</Label>
                <Input id="address.postalCode" {...form.register("address.postalCode")} />
                {addressPostalCodeError ? (
                  <p className="text-sm text-destructive">{addressPostalCodeError.message}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
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
          <Button className="w-full" variant="uber-green" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Placing order..." : "Place order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
