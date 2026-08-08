import { AlertTriangle, Package, RefreshCw, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { useOrders } from "@/lib/queries";

export default function OrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ReceiptText className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>
        <Badge variant="outline" className="w-fit">
          {orders?.length ?? 0} total
        </Badge>
      </div>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="font-medium">Couldn't load orders</p>
            <p className="text-sm text-muted-foreground">
              Make sure the backend is running at http://localhost:3000
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0">
              <CardContent className="flex items-center justify-between px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <h2 className="font-semibold">Order history</h2>
              <Badge variant="outline">{orders?.length ?? 0}</Badge>
            </div>
            {orders && orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No orders yet. Place a few orders from the store, then check
                back here.
              </p>
            ) : (
              <ul className="divide-y">
                {orders?.map((order) => {
                  const itemCount = order.lineItems.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );
                  return (
                    <li key={order.id} className="flex flex-col gap-2 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {order.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {order.couponCode && (
                            <Badge variant="secondary">
                              {order.couponCode}
                            </Badge>
                          )}
                          <span className="text-sm font-semibold tabular-nums">
                            {formatPrice(order.totalCents)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {itemCount} item{itemCount === 1 ? "" : "s"}:{" "}
                        {order.lineItems
                          .map((item) => `${item.name} × ${item.quantity}`)
                          .join(", ")}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Subtotal {formatPrice(order.subtotalCents)}</span>
                        {order.discountCents > 0 ? (
                          <span className="text-primary">
                            −{formatPrice(order.discountCents)} discount
                          </span>
                        ) : (
                          <span>No discount</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
