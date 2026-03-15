export type TaxComponent = {
  name: string;
  rate: number;
  amount: number;
};

export type DiscountInput =
  | { type: "fixed_amount"; value: number; scope: "line_item" | "sale"; reason?: string }
  | { type: "percentage"; value: number; scope: "line_item" | "sale"; reason?: string };

export type CheckoutLineInput = {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discount?: DiscountInput;
};

export type TaxRateInput = {
  name: string;
  ratePercent: number;
  appliesToCategories?: string[] | null;
  compoundOrder?: number | null;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateDiscount(base: number, discount?: DiscountInput, quantity = 1) {
  if (!discount) return 0;
  if (discount.type === "percentage") {
    return round((base * discount.value) / 100);
  }
  const limit = discount.scope === "line_item" ? discount.value * quantity : discount.value;
  return round(Math.min(base, limit));
}

export function calculateTaxes(base: number, category: string, taxRates: TaxRateInput[], taxMode: "no_tax" | "inclusive_tax" | "exclusive_tax") {
  if (taxMode === "no_tax") {
    return { taxAmount: 0, taxComponents: [] as TaxComponent[] };
  }

  const relevantRates = taxRates
    .filter((rate) => !rate.appliesToCategories || rate.appliesToCategories.includes(category))
    .sort((a, b) => (a.compoundOrder ?? 0) - (b.compoundOrder ?? 0));

  if (taxMode === "inclusive_tax") {
    const totalRate = relevantRates.reduce((sum, rate) => sum + rate.ratePercent, 0);
    if (totalRate === 0) return { taxAmount: 0, taxComponents: [] as TaxComponent[] };

    const pretaxBase = base / (1 + totalRate / 100);
    const taxComponents = relevantRates.map((rate) => ({
      name: rate.name,
      rate: rate.ratePercent,
      amount: round((pretaxBase * rate.ratePercent) / 100)
    }));

    return {
      taxAmount: round(taxComponents.reduce((sum, component) => sum + component.amount, 0)),
      taxComponents
    };
  }

  let runningBase = base;
  const taxComponents = relevantRates.map((rate) => {
    const amount = round((runningBase * rate.ratePercent) / 100);
    if (rate.compoundOrder) {
      runningBase = round(runningBase + amount);
    }
    return {
      name: rate.name,
      rate: rate.ratePercent,
      amount
    };
  });

  return {
    taxAmount: round(taxComponents.reduce((sum, component) => sum + component.amount, 0)),
    taxComponents
  };
}

export function priceCheckout(
  items: CheckoutLineInput[],
  taxRates: TaxRateInput[],
  taxMode: "no_tax" | "inclusive_tax" | "exclusive_tax",
  saleDiscount?: DiscountInput
) {
  const lineDrafts = items.map((item) => {
    const subtotal = round(item.quantity * item.unitPrice);
    const lineDiscount = calculateDiscount(subtotal, item.discount, item.quantity);
    return {
      ...item,
      subtotal,
      lineDiscount
    };
  });

  const saleBase = round(lineDrafts.reduce((sum, item) => sum + (item.subtotal - item.lineDiscount), 0));
  const saleDiscountAmount = calculateDiscount(saleBase, saleDiscount);
  let remainingAllocation = saleDiscountAmount;
  const pricedLines = lineDrafts.map((item, index) => {
    const baseAfterLineDiscount = round(item.subtotal - item.lineDiscount);
    const allocatedSaleDiscount =
      saleDiscountAmount === 0
        ? 0
        : index === lineDrafts.length - 1
          ? remainingAllocation
          : round((baseAfterLineDiscount / saleBase) * saleDiscountAmount);
    remainingAllocation = round(remainingAllocation - allocatedSaleDiscount);
    const taxableBase = round(Math.max(baseAfterLineDiscount - allocatedSaleDiscount, 0));
    const { taxAmount, taxComponents } = calculateTaxes(taxableBase, item.category, taxRates, taxMode);
    return {
      ...item,
      allocatedSaleDiscount,
      taxableBase,
      taxAmount,
      taxComponents,
      lineTotal: taxMode === "inclusive_tax" ? taxableBase : round(taxableBase + taxAmount)
    };
  });

  const subtotalAmount = round(pricedLines.reduce((sum, item) => sum + item.subtotal, 0));
  const discountAmount = round(pricedLines.reduce((sum, item) => sum + item.lineDiscount + item.allocatedSaleDiscount, 0));
  const taxAmount = round(pricedLines.reduce((sum, item) => sum + item.taxAmount, 0));
  const totalAmount = taxMode === "inclusive_tax" ? round(subtotalAmount - discountAmount) : round(subtotalAmount - discountAmount + taxAmount);

  return {
    items: pricedLines,
    subtotalAmount,
    discountAmount,
    taxAmount,
    totalAmount
  };
}
