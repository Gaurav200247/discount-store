import {
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";
import { useProducts, useStats } from "@/lib/queries";

export default function CartPage() {
  const {
    quantitiesByProductId,
    itemCount,
    setProductQuantity,
    removeProduct,
    clearCart,
    syncError,
    clearSyncError,
  } = useCart();
  const { data: products, isLoading } = useProducts();
  const { data: stats } = useStats();

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

  const availableCoupons = (stats?.coupons ?? []).filter(
    (coupon) => coupon.status === "unused",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Cart</h1>
          {itemCount > 0 && (
            <Badge variant="outline">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {itemCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear cart
          </Button>
        )}
      </div>

      {syncError && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <span className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {syncError}
          </span>
          <button
            onClick={clearSyncError}
            aria-label="Dismiss"
            className="text-destructive/70 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {itemCount === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add some products from the store to get started.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">
                Browse products
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-0 py-0">
              <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {lineItems.map(({ product, quantity }) => (
              <Card key={product.id} className="gap-0 py-0">
                <CardContent className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(product.priceCents)} each
                    </span>
                    {quantity >= product.stock && (
                      <span className="mt-0.5 text-xs font-medium text-amber-600">
                        {product.stock === 0
                          ? "Out of stock — remove to continue"
                          : `Only ${product.stock} in stock`}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <QuantityStepper
                      quantity={quantity}
                      max={product.stock}
                      onChange={(next) => setProductQuantity(product.id, next)}
                    />
                    <span className="w-20 text-right font-semibold tabular-nums">
                      {formatPrice(product.priceCents * quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="gap-0 py-0">
            <CardContent className="flex items-center justify-between px-4 py-4">
              <span className="font-medium">Subtotal</span>
              <span className="text-xl font-bold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </CardContent>
            <div className="border-t px-4 py-4">
              <div className="mb-2 flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <h2 className="font-semibold">Available coupons</h2>
                {availableCoupons.length > 0 && (
                  <Badge variant="outline">{availableCoupons.length}</Badge>
                )}
              </div>
              {availableCoupons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No unused coupons right now. Earn one on every nth order.
                </p>
              ) : (
                <ul className="divide-y">
                  {availableCoupons.map((coupon) => (
                    <li
                      key={coupon.code}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {coupon.code}
                        </span>
                        <Badge variant="secondary">
                          {coupon.discountPercent}% off
                        </Badge>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/checkout?coupon=${coupon.code}`}>
                          Apply
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t px-4 py-4">
              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">
                  Proceed to checkout
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
