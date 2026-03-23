"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { productSchema } from "@/lib/schemas/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof productSchema>;

export function ProductForm({
  locationId,
  suppliers,
  presetBarcode,
}: {
  locationId: string;
  suppliers: Array<{ id: string; name: string; label: string }>;
  presetBarcode?: string | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<Values>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      locationId,
      name: "",
      category: "",
      sku: "",
      barcode: "",
      supplierId: suppliers[0]?.id ?? "",
      unitType: "unit",
      purchasePrice: 0,
      sellingPrice: 0,
      taxCategory: "",
      parLevel: 0,
      openingStock: 0,
      allowOversell: false,
    },
  });
  const nameField = form.register("name");

  useEffect(() => {
    form.setValue("locationId", locationId, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [form, locationId]);

  useEffect(() => {
    const nextBarcode = presetBarcode?.trim();
    if (!nextBarcode) {
      return;
    }

    form.setValue("barcode", nextBarcode, {
      shouldDirty: true,
      shouldValidate: true,
    });
    nameInputRef.current?.focus();
  }, [form, presetBarcode]);

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ product: { id: string } }>("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      toast.success("Product created.");
      form.reset({
        ...form.getValues(),
        name: "",
        category: "",
        sku: "",
        barcode: "",
        purchasePrice: 0,
        sellingPrice: 0,
        taxCategory: "",
        parLevel: 0,
        openingStock: 0,
      });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create product.");
      toast.error("Unable to create product.");
    }
  });

  return (
    <Card className="gradient-panel">
      <CardHeader>
        <CardTitle>Add product</CardTitle>
        <CardDescription>
          Create a product with opening stock and par level in one step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...nameField}
              ref={(node) => {
                nameField.ref(node);
                nameInputRef.current = node;
              }}
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...form.register("category")} />
            {form.formState.errors.category ? (
              <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register("sku")} />
            {form.formState.errors.sku ? (
              <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" {...form.register("barcode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier</Label>
            <Select id="supplierId" {...form.register("supplierId")}>
              <option value="">Unassigned</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.supplierId ? (
              <p className="text-sm text-destructive">{form.formState.errors.supplierId.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitType">Unit type</Label>
            <Input id="unitType" {...form.register("unitType")} />
            {form.formState.errors.unitType ? (
              <p className="text-sm text-destructive">{form.formState.errors.unitType.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase price</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              {...form.register("purchasePrice", { valueAsNumber: true })}
            />
            {form.formState.errors.purchasePrice ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.purchasePrice.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling price</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              {...form.register("sellingPrice", { valueAsNumber: true })}
            />
            {form.formState.errors.sellingPrice ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.sellingPrice.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parLevel">Par level</Label>
            <Input
              id="parLevel"
              type="number"
              step="0.001"
              {...form.register("parLevel", { valueAsNumber: true })}
            />
            {form.formState.errors.parLevel ? (
              <p className="text-sm text-destructive">{form.formState.errors.parLevel.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="openingStock">Opening stock</Label>
            <Input
              id="openingStock"
              type="number"
              step="0.001"
              {...form.register("openingStock", { valueAsNumber: true })}
            />
            {form.formState.errors.openingStock ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.openingStock.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="taxCategory">Tax category</Label>
            <Input id="taxCategory" {...form.register("taxCategory")} />
            {form.formState.errors.taxCategory ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.taxCategory.message}
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive md:col-span-2">{serverError}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
