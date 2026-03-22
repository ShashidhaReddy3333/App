"use client";

import Link from "next/link";

import { SearchFilter } from "@/components/search-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

type SalesListItem = {
  id: string;
  receiptNumber: string;
  statusLabel: string;
  totalAmount: string;
  amountPaid: string;
  cashierName: string;
  completedAtLabel: string;
};

export function SalesList({ items }: { items: SalesListItem[] }) {
  return (
    <SearchFilter data={items} searchKey="receiptNumber" placeholder="Search by receipt number...">
      {(filtered) => (
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sales match your search.
            </p>
          ) : null}
          {filtered.map((sale, index) => (
            <Link key={sale.id} href={`/app/sales/${sale.id}`}>
              <Card
                className={`gradient-panel transition-all duration-200 hover:border-primary/40 hover:shadow-md animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{sale.receiptNumber}</CardTitle>
                    <StatusBadge status={sale.statusLabel} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Total
                    </span>
                    <div className="font-semibold text-foreground">${sale.totalAmount}</div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Paid
                    </span>
                    <div className="font-semibold text-foreground">${sale.amountPaid}</div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Cashier
                    </span>
                    <div className="font-medium">{sale.cashierName}</div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                      Date
                    </span>
                    <div className="font-medium">{sale.completedAtLabel}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </SearchFilter>
  );
}
