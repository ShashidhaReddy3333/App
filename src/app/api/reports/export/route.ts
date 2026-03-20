import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/api-guard";
import { toCsv } from "@/lib/export";
import { apiError } from "@/lib/http";
import { db } from "@/lib/db";
import { getDefaultLocation } from "@/lib/services/platform-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { businessId } = await requireApiAccess("reports");
    const type = request.nextUrl.searchParams.get("type");

    let csv: string;
    let filename: string;

    switch (type) {
      case "sales": {
        const sales = await db.sale.findMany({
          where: { businessId },
          include: {
            cashier: true,
            items: { include: { product: true } }
          },
          orderBy: { createdAt: "desc" }
        });

        const headers = ["Receipt Number", "Date", "Customer", "Items", "Subtotal", "Tax", "Total", "Status"];
        const rows = sales.map((sale) => [
          sale.receiptNumber ?? "",
          sale.completedAt ? sale.completedAt.toISOString() : sale.createdAt.toISOString(),
          "",
          sale.items.map((item) => `${item.product.name} x${Number(item.quantity)}`).join("; "),
          Number(sale.subtotalAmount).toFixed(2),
          Number(sale.taxAmount).toFixed(2),
          Number(sale.totalAmount).toFixed(2),
          sale.status
        ]);

        csv = toCsv(headers, rows);
        filename = "sales.csv";
        break;
      }

      case "products": {
        const location = await getDefaultLocation(businessId);
        const products = await db.product.findMany({
          where: { businessId, isArchived: false },
          include: {
            supplier: true,
            inventoryBalances: {
              where: { locationId: location.id }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        const headers = ["SKU", "Name", "Category", "Supplier", "Selling Price", "Purchase Price", "Stock On Hand", "Status"];
        const rows = products.map((product) => {
          const balance = product.inventoryBalances[0];
          const onHand = balance ? Number(balance.onHandQuantity) : 0;
          return [
            product.sku,
            product.name,
            product.category ?? "",
            product.supplier?.name ?? "",
            Number(product.sellingPrice).toFixed(2),
            Number(product.purchasePrice).toFixed(2),
            onHand,
            product.isArchived ? "Archived" : "Active"
          ];
        });

        csv = toCsv(headers, rows);
        filename = "products.csv";
        break;
      }

      case "suppliers": {
        const suppliers = await db.supplier.findMany({
          where: { businessId },
          orderBy: { name: "asc" }
        });

        const headers = ["Name", "Contact", "Email", "Phone", "Status"];
        const rows = suppliers.map((supplier) => [
          supplier.name,
          supplier.contactName ?? "",
          supplier.email ?? "",
          supplier.phone ?? "",
          "Active"
        ]);

        csv = toCsv(headers, rows);
        filename = "suppliers.csv";
        break;
      }

      default:
        return NextResponse.json({ message: "Invalid export type. Use: sales, products, or suppliers." }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
