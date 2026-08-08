import { AlertTriangle, Package, RefreshCw } from "lucide-react";

import { AddProductForm } from "@/components/admin/AddProductForm";
import { StockControl } from "@/components/admin/StockControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { useProducts } from "@/lib/queries";

export function ProductsTab() {
  const { data: products, isLoading, isError, refetch } = useProducts();

  return (
    <div className="flex flex-col gap-6">
      <AddProductForm />

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="font-medium">Couldn't load products</p>
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
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              <h2 className="font-semibold">Products</h2>
              <Badge variant="outline">{products?.length ?? 0}</Badge>
            </div>
            <ul className="divide-y">
              {products?.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(product.priceCents)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {product.stock === 0 && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Out of stock
                      </Badge>
                    )}
                    <StockControl id={product.id} stock={product.stock} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
