"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { customerCheckoutSchema } from "@/lib/schemas/customer-commerce";
import { paymentMethods, paymentProviders } from "@/lib/schemas/sales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof customerCheckoutSchema>;

export function CustomerCheckoutForm({ cartTotal }: { cartTotal: number }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(customerCheckoutSchema),
    defaultValues: {
      fulfillmentType: "pickup",
      paymentMethod: "credit_card",
      paymentProvider: "stripe",
      idempotencyKey: uuid(),
      notes: ""
    }
  });

  const fulfillmentType = form.watch("fulfillmentType");

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const payload = await requestJson<{ order: { id: string } }>("/api/customer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
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
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Confirm fulfillment and payment for your order of ${cartTotal.toFixed(2)}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("idempotencyKey")} />
          <div className="space-y-2">
            <Label htmlFor="fulfillmentType">Fulfillment</Label>
            <Select id="fulfillmentType" {...form.register("fulfillmentType")}>
              <option value="pickup">pickup</option>
              <option value="delivery">delivery</option>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Select id="paymentMethod" {...form.register("paymentMethod")}>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentProvider">Provider</Label>
              <Select id="paymentProvider" {...form.register("paymentProvider")}>
                {paymentProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {fulfillmentType === "delivery" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.label">Address label</Label>
                <Input id="address.label" {...form.register("address.label")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.line1">Address line 1</Label>
                <Input id="address.line1" {...form.register("address.line1")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.line2">Address line 2</Label>
                <Input id="address.line2" {...form.register("address.line2")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.city">City</Label>
                <Input id="address.city" {...form.register("address.city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.province">Province</Label>
                <Input id="address.province" {...form.register("address.province")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address.postalCode">Postal code</Label>
                <Input id="address.postalCode" {...form.register("address.postalCode")} />
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
          <Button className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Placing order..." : "Place order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
