import { decimalToNumber } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

type CatalogData = Awaited<ReturnType<typeof import("@/lib/services/catalog-query-service").listCatalogData>>;
type DashboardMetrics = Awaited<ReturnType<typeof import("@/lib/services/reporting-query-service").getDashboardMetrics>>;
type ReportsSnapshot = Awaited<ReturnType<typeof import("@/lib/services/reporting-query-service").getReportsSnapshot>>;
type SalesList = Awaited<ReturnType<typeof import("@/lib/services/sales-query-service").listSales>>;
type SaleDetail = Awaited<ReturnType<typeof import("@/lib/services/sales-query-service").getSaleDetail>>;
type StaffList = Awaited<ReturnType<typeof import("@/lib/services/management-query-service").listStaff>>;
type PendingInviteList = Awaited<ReturnType<typeof import("@/lib/services/management-query-service").listPendingInvites>>;
type SessionList = Awaited<ReturnType<typeof import("@/lib/services/management-query-service").listBusinessSessions>>;
type OperationsSnapshot = Awaited<ReturnType<typeof import("@/lib/services/operations-query-service").getOperationsSnapshot>>;

export function toProductTableRows(products: CatalogData["products"]) {
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

export function toCheckoutProductOptions(products: CatalogData["products"]) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    label: `${product.name} - ${product.sku}`,
    sellingPrice: decimalToNumber(product.sellingPrice)
  }));
}

export function toProductOptions(products: CatalogData["products"]) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    label: `${product.name} - ${product.sku}`
  }));
}

export function toSupplierOptions(suppliers: CatalogData["suppliers"]) {
  return suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    label: supplier.name
  }));
}

export function toSalesListItems(sales: SalesList) {
  return sales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receiptNumber ?? sale.id.slice(0, 8),
    statusLabel: sale.status.replaceAll("_", " "),
    totalAmount: sale.totalAmount.toString(),
    amountPaid: sale.amountPaid.toString(),
    cashierName: sale.cashier.fullName,
    completedAtLabel: sale.completedAt ? new Date(sale.completedAt).toLocaleString() : "Pending completion"
  }));
}

export function toRefundItemOptions(items: SaleDetail["items"]) {
  return items.map((item) => ({
    id: item.id,
    label: `${item.product.name} (${item.quantity.toString()})`
  }));
}

export function toStaffCards(staff: StaffList) {
  return staff.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    roleLabel: user.role.replaceAll("_", " "),
    status: user.status
  }));
}

export function toPendingInviteCards(invites: PendingInviteList) {
  return invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    roleLabel: invite.role.replaceAll("_", " "),
    statusLabel: "pending",
    createdAtLabel: formatDateTime(invite.createdAt),
    expiresAtLabel: formatDateTime(invite.expiresAt)
  }));
}

export function toSessionCards(sessions: SessionList) {
  return sessions.map((session) => ({
    id: session.id,
    userName: session.user.fullName,
    deviceName: session.deviceName,
    lastSeenLabel: session.lastSeenAt ? formatDateTime(session.lastSeenAt) : "Never"
  }));
}

export function toFailedNotificationCards(notifications: OperationsSnapshot["recentFailedNotifications"]) {
  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type.replaceAll("_", " "),
    channel: notification.channel.replaceAll("_", " "),
    status: notification.status.replaceAll("_", " "),
    userName: notification.user.fullName,
    userEmail: notification.user.email,
    createdAtLabel: formatDateTime(notification.createdAt)
  }));
}

export function toAuditActivityCards(entries: OperationsSnapshot["recentAudit"]) {
  return entries.map((entry) => ({
    id: entry.id,
    actionLabel: entry.action.replaceAll("_", " "),
    resourceLabel: `${entry.resourceType} - ${entry.resourceId}`,
    createdAtLabel: formatDateTime(entry.createdAt)
  }));
}

export function toDashboardCards(metrics: DashboardMetrics) {
  return [
    { title: "Today's sales", value: `$${metrics.salesToday.toFixed(2)}` },
    { title: "Orders", value: metrics.totalOrders.toString() },
    { title: "Online orders", value: metrics.onlineOrdersToday.toString() },
    { title: "Low-stock alerts", value: metrics.lowStockAlerts.toString() },
    { title: "Pending payments", value: metrics.pendingPayments.toString() },
    { title: "Open purchase orders", value: metrics.openPurchaseOrders.toString() },
    { title: "Supplier SKUs", value: metrics.supplierCatalogCount.toString() }
  ];
}

export function toReportCards(report: ReportsSnapshot) {
  return [
    { title: "Daily revenue", value: `$${report.dailyRevenue.toFixed(2)}` },
    { title: "Monthly revenue", value: `$${report.monthlyRevenue.toFixed(2)}` },
    { title: "Transactions", value: report.transactionCount.toString() },
    { title: "Online orders", value: report.onlineOrderCount.toString() },
    { title: "Open purchase orders", value: report.openPurchaseOrders.toString() }
  ];
}
