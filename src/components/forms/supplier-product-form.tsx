"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { supplierProductSchema } from "@/lib/schemas/procurement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof supplierProductSchema>;

export function SupplierProductForm({
  mappedProducts
}: {
  mappedProducts: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(supplierProductSchema),
    defaultValues: {
      name: "",
      description: "",
      mappedProductId: mappedProducts[0]?.id ?? "",
      minimumOrderQuantity: 1,
      casePackSize: 1,
      wholesalePrice: 0,
      leadTimeDays: 2,
      deliveryFee: 0,
      serviceArea: "",
      imageUrl: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ supplierProduct: { id: string } }>("/api/supplier/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Wholesale product created.");
      form.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to save wholesale product.");
      toast.error("Unable to save wholesale product.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add wholesale product</CardTitle>
        <CardDescription>Offer mapped retail products to the manager with MOQ, lead time, and wholesale pricing.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.name ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.name.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mappedProductId">Mapped retail product</Label>
            <Select id="mappedProductId" {...form.register("mappedProductId")}>
              <option value="">Select product</option>
              {mappedProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </Select>
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.mappedProductId ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.mappedProductId.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimumOrderQuantity">MOQ</Label>
            <Input id="minimumOrderQuantity" type="number" step="1" {...form.register("minimumOrderQuantity")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.minimumOrderQuantity ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.minimumOrderQuantity.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="casePackSize">Case pack size</Label>
            <Input id="casePackSize" type="number" step="1" {...form.register("casePackSize")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.casePackSize ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.casePackSize.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wholesalePrice">Wholesale price</Label>
            <Input id="wholesalePrice" type="number" step="0.01" {...form.register("wholesalePrice")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.wholesalePrice ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.wholesalePrice.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadTimeDays">Lead time (days)</Label>
            <Input id="leadTimeDays" type="number" step="1" {...form.register("leadTimeDays")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.leadTimeDays ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.leadTimeDays.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery fee</Label>
            <Input id="deliveryFee" type="number" step="0.01" {...form.register("deliveryFee")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.deliveryFee ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.deliveryFee.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service area</Label>
            <Input id="serviceArea" {...form.register("serviceArea")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.serviceArea ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.serviceArea.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.description ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.description.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" {...form.register("imageUrl")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.imageUrl ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.imageUrl.message}</p> : null}
            </div>
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save wholesale product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
