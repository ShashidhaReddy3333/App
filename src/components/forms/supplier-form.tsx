"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ApiClientError, applyFormIssues, requestJson } from "@/lib/client/api";
import { supplierSchema } from "@/lib/schemas/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type Values = z.infer<typeof supplierSchema>;

export function SupplierForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      notes: ""
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestJson<{ supplier: { id: string } }>("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      toast.success("Supplier created.");
      form.reset();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        applyFormIssues(form, error.issues);
        setServerError(error.message);
        toast.error(error.message);
        return;
      }
      setServerError("Unable to create supplier.");
      toast.error("Unable to create supplier.");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New supplier</CardTitle>
        <CardDescription>Add a supplier for purchase planning and reorder grouping.</CardDescription>
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
            <Label htmlFor="contactName">Contact name</Label>
            <Input id="contactName" {...form.register("contactName")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.contactName ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.contactName.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.email ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.email.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.phone ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.phone.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
            <div aria-live="polite" aria-atomic="true">
              {form.formState.errors.notes ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.notes.message}</p> : null}
            </div>
          </div>
          {serverError ? <p className="text-sm text-destructive md:col-span-2" aria-live="polite" aria-atomic="true" role="alert">{serverError}</p> : null}
          <div className="md:col-span-2">
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save supplier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
