import {
  AlertTriangle,
  Check,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";
import { useDiscountConfig, useProducts } from "@/lib/queries";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Out of stock
      </Badge>
    );
  }
  if (stock <= 3) {
    return (
      <Badge variant="secondary" className="text-amber-600">
        Only {stock} left
      </Badge>
    );
  }
  return <Badge variant="secondary">In stock</Badge>;
}

export default function HomePage() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const { data: config } = useDiscountConfig();
  const { quantitiesByProductId, addProduct, removeProduct } = useCart();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col items-center gap-4 py-10 text-center">
        <Badge variant="secondary">
          <Sparkles className="size-3" />
          Every milestone order earns a coupon
        </Badge>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Buy more, <span className="text-primary">unlock discounts</span>
        </h1>
        <p className="max-w-xl text-muted-foreground">
          {config
            ? `On the ${config.n}th, ${config.n * 2}th, ${config.n * 3}th order… you earn a ${config.percent}% coupon to use on any order.`
            : "Every milestone order earns a discount coupon you can use on any order."}
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShoppingBag className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Products</h2>
        </div>

        {isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="size-8 text-destructive" />
              <p className="font-medium">Couldn't load products</p>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="gap-3">
                <CardContent className="flex flex-col gap-3 px-4 py-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products?.map((product) => {
              const inCart = (quantitiesByProductId[product.id] ?? 0) > 0;
              return (
                <Card key={product.id} className="gap-3">
                  <CardContent className="flex flex-col gap-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <StockBadge stock={product.stock} />
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(product.priceCents)}
                    </p>
                    {inCart ? (
                      <div className="flex w-full items-center gap-2">
                        <Button disabled className="flex-1">
                          <Check className="size-4" />
                          Added to cart
                        </Button>
                        <Button
                          variant="outline"
                          aria-label={`Remove ${product.name} from cart`}
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={product.stock === 0}
                        onClick={() => addProduct(product.id)}
                      >
                        <ShoppingCart className="size-4" />
                        {product.stock === 0 ? "Out of stock" : "Add to cart"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
