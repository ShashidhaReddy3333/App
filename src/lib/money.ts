import { Prisma } from "@prisma/client";

export function toCents(value: number) {
  return Math.round(value * 100);
}

export function fromCents(value: number) {
  return value / 100;
}

export function roundMoney(value: number) {
  return fromCents(toCents(value));
}

export function toDecimal(value: number | string) {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(value: Prisma.Decimal | number | string) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}
