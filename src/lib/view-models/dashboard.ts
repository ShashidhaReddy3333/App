export function toDashboardCards(metrics: {
  salesToday: number;
  totalOrders: number;
  lowStockAlerts: number;
  pendingPayments: number;
}) {
  return [
    { title: "Today's sales", value: `$${metrics.salesToday.toFixed(2)}` },
    { title: "Orders", value: String(metrics.totalOrders) },
    { title: "Low-stock alerts", value: String(metrics.lowStockAlerts) },
    { title: "Pending payments", value: String(metrics.pendingPayments) }
  ];
}
