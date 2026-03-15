"use client";

import { useState } from "react";
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
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof productSchema>;

export function ProductForm({
  locationId,
  suppliers
}: {
  locationId: string;
  suppliers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
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
      allowOversell: false
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ product: { id: string } }>("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Product created.");
      form.reset({ ...form.getValues(), name: "", category: "", sku: "", barcode: "", purchasePrice: 0, sellingPrice: 0, taxCategory: "", parLevel: 0, openingStock: 0 });
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
        <CardDescription>Create a product with opening stock and par level in one step.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <input type="hidden" {...form.register("locationId")} />
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...form.register("category")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...form.register("sku")} />
            {form.formState.errors.sku ? <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" {...form.register("barcode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier ID</Label>
            <Input id="supplierId" list="supplier-options" {...form.register("supplierId")} />
            <datalist id="supplier-options">
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitType">Unit type</Label>
            <Input id="unitType" {...form.register("unitType")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase price</Label>
            <Input id="purchasePrice" type="number" step="0.01" {...form.register("purchasePrice", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling price</Label>
            <Input id="sellingPrice" type="number" step="0.01" {...form.register("sellingPrice", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parLevel">Par level</Label>
            <Input id="parLevel" type="number" step="0.001" {...form.register("parLevel", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openingStock">Opening stock</Label>
            <Input id="openingStock" type="number" step="0.001" {...form.register("openingStock", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="taxCategory">Tax category</Label>
            <Input id="taxCategory" {...form.register("taxCategory")} />
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}
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
