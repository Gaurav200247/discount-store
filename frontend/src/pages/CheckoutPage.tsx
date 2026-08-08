import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShoppingCart,
  Tag,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";
import { useProducts } from "@/lib/queries";
import type { Order } from "@/lib/types";

export default function CheckoutPage() {
  const { quantitiesByProductId, itemCount, checkout } = useCart();
  const { data: products, isLoading } = useProducts();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [couponCode, setCouponCode] = useState(
    () => searchParams.get("coupon") ?? "",
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsById = new Map((products ?? []).map((p) => [p.id, p]));
  const lineItems = Object.entries(quantitiesByProductId)
    .flatMap(([productId, quantity]) => {
      const product = productsById.get(productId);
      return product ? [{ product, quantity }] : [];
    })
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
  const subtotal = lineItems.reduce(
    (sum, { product, quantity }) => sum + product.priceCents * quantity,
    0,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (itemCount === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await checkout(couponCode.trim() || undefined);
      setOrder(result);
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong placing your order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setSearchParams({}, { replace: true });
  }

  if (order) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Order confirmed</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <BadgeCheck className="size-12 text-primary" />
              <p className="text-lg font-semibold">Thanks for your order!</p>
              <p className="text-sm text-muted-foreground">
                Order{" "}
                <span className="font-mono font-medium text-foreground">
                  {order.id.slice(0, 8)}
                </span>{" "}
                has been placed.
              </p>
            </div>

            <div className="divide-y rounded-md border">
              {order.lineItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span>
                    {item.name}{" "}
                    <span className="text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(item.lineTotalCents)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatPrice(order.subtotalCents)}
                </span>
              </div>
              {order.discountCents > 0 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm text-primary">
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5" />
                    Coupon {order.couponCode}
                  </span>
                  <span className="tabular-nums">
                    −{formatPrice(order.discountCents)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatPrice(order.totalCents)}
                </span>
              </div>
            </div>

            <Button asChild>
              <Link to="/">
                Continue shopping
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <ShoppingCart className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nothing to check out</p>
              <p className="text-sm text-muted-foreground">
                Your cart is empty — add some products first.
              </p>
            </div>
            <Button asChild>
              <Link to="/">
                Browse products
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <CreditCard className="size-5 text-primary" />
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Badge variant="outline">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Order summary
          </h2>
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="gap-0 py-0">
                <CardContent className="flex items-center justify-between px-4 py-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {lineItems.map(({ product, quantity }) => (
                <Card key={product.id} className="gap-0 py-0">
                  <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {product.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(product.priceCents)} × {quantity}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatPrice(product.priceCents * quantity)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <Card className="gap-0 py-0">
            <CardContent className="flex items-center justify-between px-4 py-4">
              <span className="font-medium">Subtotal</span>
              <span className="text-lg font-bold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </CardContent>
            {error && (
              <div className="flex items-start justify-between gap-3 border-t px-4 py-3">
                <span className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </span>
                <button
                  onClick={() => setError(null)}
                  aria-label="Dismiss"
                  className="text-destructive/70 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 py-6">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <h2 className="font-semibold">Coupon</h2>
              </div>
              {couponCode ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-primary">
                    <Tag className="size-4 shrink-0" />
                    <span className="truncate font-mono font-semibold">
                      {couponCode}
                    </span>
                    <Badge variant="secondary">applied</Badge>
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No coupon applied. Apply an available coupon from your{" "}
                  <Link
                    to="/cart"
                    className="font-medium text-primary hover:underline"
                  >
                    cart
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Placing order…
              </>
            ) : (
              <>
                Place order
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your order will be saved and the nth-order coupon milestone tracked.
          </p>
        </form>
      </div>
    </div>
  );
}
