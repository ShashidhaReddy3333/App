import { PaymentStatus } from "@prisma/client";

import { roundMoney } from "@/lib/money";

export function formatReceiptNumber(sequence: number) {
  return `RCPT-${String(sequence).padStart(6, "0")}`;
}

export function formatOrderNumber(sequence: number) {
  return `ORD-${String(sequence).padStart(6, "0")}`;
}

export function formatPurchaseOrderNumber(sequence: number) {
  return `PO-${String(sequence).padStart(6, "0")}`;
}

export function calculateRefundLineAmount(lineTotal: number, lineQuantity: number, refundQuantity: number) {
  return roundMoney((lineTotal / lineQuantity) * refundQuantity);
}

export function sumSuccessfulPayments(payments: Array<{ amount: number; status: PaymentStatus }>) {
  const countedStatuses: PaymentStatus[] = [PaymentStatus.settled, PaymentStatus.captured, PaymentStatus.authorized];
  return roundMoney(payments.filter((payment) => countedStatuses.includes(payment.status)).reduce((sum, payment) => sum + payment.amount, 0));
}
