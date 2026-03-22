export type StatusBadgeVariant = "secondary" | "warning" | "info" | "success" | "destructive";

type StatusTone = "neutral" | "pending" | "active" | "success" | "danger";

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

export function getStatusTone(status: string): StatusTone {
  const normalized = status.trim().toLowerCase();

  if (includesAny(normalized, ["refunded", "failed", "cancelled", "rejected", "voided", "error"])) {
    return "danger";
  }

  if (
    includesAny(normalized, [
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "ready",
      "out_for_delivery",
      "in_progress",
      "in_transit",
      "accepted",
      "shipped",
      "authorized",
      "scheduled",
      "running",
      "active",
      "partially_received",
    ])
  ) {
    return "active";
  }

  if (
    includesAny(normalized, [
      "completed",
      "fulfilled",
      "delivered",
      "settled",
      "received",
      "sent",
      "paid",
      "read",
      "closed",
      "captured",
    ])
  ) {
    return "success";
  }

  if (includesAny(normalized, ["pending", "queued", "draft", "ordered", "awaiting", "placed"])) {
    return normalized.includes("draft") ? "neutral" : "pending";
  }

  return "neutral";
}

export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (getStatusTone(status)) {
    case "pending":
      return "warning";
    case "active":
      return "info";
    case "success":
      return "success";
    case "danger":
      return "destructive";
    case "neutral":
    default:
      return "secondary";
  }
}

export function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function getStatusBorderClass(status: string) {
  switch (getStatusTone(status)) {
    case "pending":
      return "border-l-amber-500";
    case "active":
      return "border-l-sky-500";
    case "success":
      return "border-l-emerald-500";
    case "danger":
      return "border-l-red-500";
    case "neutral":
    default:
      return "border-l-slate-300";
  }
}

export function getStatusDotClass(status: string) {
  switch (getStatusTone(status)) {
    case "pending":
      return "bg-amber-500 ring-4 ring-amber-100";
    case "active":
      return "bg-sky-500 ring-4 ring-sky-100";
    case "success":
      return "bg-emerald-500 ring-4 ring-emerald-100";
    case "danger":
      return "bg-red-500 ring-4 ring-red-100";
    case "neutral":
    default:
      return "bg-slate-400 ring-4 ring-slate-100";
  }
}
