import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/api-guard";
import { toCsv } from "@/lib/export";
import { apiError } from "@/lib/http";
import { db } from "@/lib/db";
import { reportsExportFiltersSchema } from "@/lib/schemas/platform";
import { resolveBusinessLocation } from "@/lib/services/platform-service";
import { zonedDateTimeToUtc } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function parseDateParts(value: string) {
  const parts = value.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return { year, month, day };
}

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireApiAccess("reports");
    const filters = reportsExportFiltersSchema.parse({
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      locationId: request.nextUrl.searchParams.get("locationId") ?? undefined,
      dateFrom: request.nextUrl.searchParams.get("dateFrom") ?? undefined,
      dateTo: request.nextUrl.searchParams.get("dateTo") ?? undefined,
    });
    const business = await db.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { timezone: true },
    });
    const location = filters.locationId
      ? await resolveBusinessLocation(businessId, filters.locationId)
      : null;

    const salesDateFilter =
      filters.type === "sales" && filters.dateFrom && filters.dateTo
        ? {
            createdAt: {
              gte: (() => {
                const { year, month, day } = parseDateParts(filters.dateFrom);
                return zonedDateTimeToUtc(business.timezone, year, month, day, 0, 0, 0);
              })(),
              lte: (() => {
                const { year, month, day } = parseDateParts(filters.dateTo);
                return zonedDateTimeToUtc(business.timezone, year, month, day, 23, 59, 59);
              })(),
            },
          }
        : {};

    let csv: string;
    let filename: string;

    switch (filters.type) {
      case "sales": {
        const sales = await db.sale.findMany({
          where: {
            businessId,
            ...(location ? { locationId: location.id } : {}),
            ...salesDateFilter,
          },
          include: {
            location: true,
            cashier: true,
            items: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Receipt Number",
          "Date",
          "Location",
          "Customer",
          "Items",
          "Subtotal",
          "Tax",
          "Total",
          "Status",
        ];
        const rows = sales.map((sale) => [
          sale.receiptNumber ?? "",
          sale.completedAt ? sale.completedAt.toISOString() : sale.createdAt.toISOString(),
          sale.location.name,
          "",
          sale.items.map((item) => `${item.product.name} x${Number(item.quantity)}`).join("; "),
          Number(sale.subtotalAmount).toFixed(2),
          Number(sale.taxAmount).toFixed(2),
          Number(sale.totalAmount).toFixed(2),
          sale.status,
        ]);

        csv = toCsv(headers, rows);
        filename = "sales.csv";
        break;
      }

      case "products": {
        const exportLocation = location ?? (await resolveBusinessLocation(businessId));
        const products = await db.product.findMany({
          where: { businessId, isArchived: false },
          include: {
            supplier: true,
            inventoryBalances: {
              where: { locationId: exportLocation.id },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "SKU",
          "Name",
          "Category",
          "Location",
          "Supplier",
          "Selling Price",
          "Purchase Price",
          "Stock On Hand",
          "Status",
        ];
        const rows = products.map((product) => {
          const balance = product.inventoryBalances[0];
          const onHand = balance ? Number(balance.onHandQuantity) : 0;
          return [
            product.sku,
            product.name,
            product.category ?? "",
            exportLocation.name,
            product.supplier?.name ?? "",
            Number(product.sellingPrice).toFixed(2),
            Number(product.purchasePrice).toFixed(2),
            onHand,
            product.isArchived ? "Archived" : "Active",
          ];
        });

        csv = toCsv(headers, rows);
        filename = "products.csv";
        break;
      }

      case "suppliers": {
        const suppliers = await db.supplier.findMany({
          where: { businessId },
          orderBy: { name: "asc" },
        });

        const headers = ["Name", "Contact", "Email", "Phone", "Status"];
        const rows = suppliers.map((supplier) => [
          supplier.name,
          supplier.contactName ?? "",
          supplier.email ?? "",
          supplier.phone ?? "",
          "Active",
        ]);

        csv = toCsv(headers, rows);
        filename = "suppliers.csv";
        break;
      }

      default:
        return NextResponse.json(
          { message: "Invalid export type. Use: sales, products, or suppliers." },
          { status: 400 }
        );
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
