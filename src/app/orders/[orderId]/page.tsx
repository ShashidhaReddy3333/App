import { CustomerShell } from "@/components/customer-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerOrderDetail } from "@/lib/services/customer-commerce-query-service";

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireRole("customer", "/sign-in");
  const { orderId } = await params;
  const order = await getCustomerOrderDetail(session.user.id, orderId);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            {order.status.replaceAll("_", " ")} - {order.fulfillmentType.replaceAll("_", " ")}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="gradient-panel">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between rounded-2xl border p-3 text-sm">
                  <span>{item.product.name}</span>
                  <span>
                    {Number(item.quantity).toFixed(0)} x ${Number(item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="gradient-panel">
              <CardHeader>
                <CardTitle>Fulfillment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Status: {order.fulfillment?.status.replaceAll("_", " ")}</div>
                <div>Type: {order.fulfillmentType.replaceAll("_", " ")}</div>
                {order.fulfillment?.deliveryAddress ? (
                  <div>
                    Address: {order.fulfillment.deliveryAddress.line1}, {order.fulfillment.deliveryAddress.city}
                  </div>
                ) : (
                  <div>Pickup from {order.location.name}</div>
                )}
              </CardContent>
            </Card>
            <Card className="gradient-panel">
              <CardHeader>
                <CardTitle>Payments and status history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {order.payments.map((payment) => (
                  <div key={payment.id}>
                    {payment.method.replaceAll("_", " ")} - ${Number(payment.amount).toFixed(2)} - {payment.status.replaceAll("_", " ")}
                  </div>
                ))}
                <div className="border-t pt-2 font-medium text-foreground">Total ${Number(order.totalAmount).toFixed(2)}</div>
                <div className="border-t pt-2">
                  {order.statusHistory.map((entry) => (
                    <div key={entry.id}>
                      {entry.newStatus.replaceAll("_", " ")} - {new Date(entry.changedAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
