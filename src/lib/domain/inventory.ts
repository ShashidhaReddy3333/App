export function computeAvailableQuantity(onHandQuantity: number, reservedQuantity: number) {
  return Number((onHandQuantity - reservedQuantity).toFixed(3));
}

export function computeReorderQuantity(parLevel: number, availableQuantity: number) {
  return Math.max(Number((parLevel - availableQuantity).toFixed(3)), 0);
}

export function canReserveStock(availableQuantity: number, requestedQuantity: number, allowOversell: boolean) {
  return allowOversell || availableQuantity >= requestedQuantity;
}
