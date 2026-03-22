"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CustomerOption = {
  id: string;
  fullName: string;
  email: string;
  loyaltyPoints: number;
};

function formatPointsAsCurrency(points: number) {
  return `$${(points / 100).toFixed(2)}`;
}

export function CheckoutCustomerField({
  customerId,
  loyaltyPointsToRedeem,
  onCustomerChange,
  onLoyaltyPointsChange,
}: {
  customerId: string;
  loyaltyPointsToRedeem: number;
  onCustomerChange: (customerId: string) => void;
  onLoyaltyPointsChange: (points: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const payload = await requestJson<{ customers: CustomerOption[] }>(
          `/api/customers/search?q=${encodeURIComponent(query.trim())}`
        );
        setResults(payload.customers);
      } catch (error) {
        setError(error instanceof ApiClientError ? error.message : "Unable to search customers.");
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!customerId) {
      setSelectedCustomer(null);
    }
  }, [customerId]);

  const maxRedeemablePoints = useMemo(
    () => selectedCustomer?.loyaltyPoints ?? 0,
    [selectedCustomer]
  );

  return (
    <div className="rounded-[24px] border border-border/25 bg-[hsl(var(--surface-lowest))]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="customer-search">Customer (optional)</Label>
          <Input
            id="customer-search"
            className="h-12 text-base"
            placeholder="Search customers by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Select a customer to apply existing loyalty points to this POS sale.
          </p>
          {searching ? <p className="text-xs text-muted-foreground">Searching...</p> : null}
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {results.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-border/30 bg-[hsl(var(--surface-low))] p-3">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                    customer.id === customerId
                      ? "border-primary/40 bg-primary/[0.06]"
                      : "border-transparent bg-white/80 hover:border-border/40 hover:bg-white"
                  }`}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setQuery("");
                    setResults([]);
                    onCustomerChange(customer.id);
                  }}
                >
                  <div>
                    <div className="font-medium text-foreground">{customer.fullName}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-foreground">
                      {customer.loyaltyPoints} pts
                    </div>
                    <div className="text-muted-foreground">
                      {formatPointsAsCurrency(customer.loyaltyPoints)} available
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
          {selectedCustomer ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/[0.05] px-4 py-3">
              <div>
                <div className="font-medium text-foreground">{selectedCustomer.fullName}</div>
                <div className="text-sm text-muted-foreground">{selectedCustomer.email}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedCustomer(null);
                  onCustomerChange("");
                  onLoyaltyPointsChange(0);
                }}
              >
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="loyaltyPointsToRedeem">Redeem loyalty points</Label>
          <Input
            id="loyaltyPointsToRedeem"
            className="h-12 text-base"
            type="number"
            min={0}
            max={maxRedeemablePoints}
            step="1"
            value={loyaltyPointsToRedeem}
            onChange={(event) => onLoyaltyPointsChange(Number(event.target.value || 0))}
            disabled={!selectedCustomer}
          />
          <p className="text-xs text-muted-foreground">
            100 points = $1.00 off. The applied amount is capped by the available balance and the
            pre-tax sale subtotal.
          </p>
          {selectedCustomer ? (
            <p className="text-xs text-muted-foreground">
              Available: {selectedCustomer.loyaltyPoints} pts (
              {formatPointsAsCurrency(selectedCustomer.loyaltyPoints)})
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Select a customer to enable redemption.</p>
          )}
          {selectedCustomer && loyaltyPointsToRedeem > 0 ? (
            <p className="text-xs font-medium text-foreground">
              Applying {Math.min(loyaltyPointsToRedeem, selectedCustomer.loyaltyPoints)} points ={" "}
              {formatPointsAsCurrency(
                Math.min(loyaltyPointsToRedeem, selectedCustomer.loyaltyPoints)
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
