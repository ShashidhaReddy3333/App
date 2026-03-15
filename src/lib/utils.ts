import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "CAD", locale = "en-CA") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatDate(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy");
}
