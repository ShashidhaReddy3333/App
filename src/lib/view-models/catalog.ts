import type { Prisma } from "@prisma/client";

import { decimalToNumber } from "@/lib/money";

export function toProductTableRows(
  products: Array<
    Prisma.ProductGetPayload<{
      include: {
        supplier: true;
      };
    }> & { availableQuantity: number; reorderQuantity: number }
  >
) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    sellingPrice: decimalToNumber(product.sellingPrice),
    availableQuantity: product.availableQuantity,
    reorderQuantity: product.reorderQuantity,
    supplierName: product.supplier?.name ?? "Unassigned"
  }));
}
