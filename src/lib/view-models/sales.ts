export function toReceiptItems(
  items: Array<{
    id: string;
    quantity: { toString(): string };
    unitPrice: { toString(): string };
    lineDiscountAmount: { toString(): string };
    taxAmount: { toString(): string };
    lineTotal: { toString(): string };
    product: { name: string };
  }>
) {
  return items.map((item) => ({
    id: item.id,
    name: item.product.name,
    quantityLabel: item.quantity.toString(),
    unitPriceLabel: item.unitPrice.toString(),
    discountLabel: item.lineDiscountAmount.toString(),
    taxLabel: item.taxAmount.toString(),
    totalLabel: item.lineTotal.toString()
  }));
}
