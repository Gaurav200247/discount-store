import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateProduct } from "@/lib/queries";

export function AddProductForm() {
  const createProduct = useCreateProduct();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const priceCents = Math.round(Number(price) * 100);
    const stockNum = Number(stock);
    if (!name.trim()) {
      setFormError("Please enter a product name.");
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setFormError("Please enter a valid price greater than 0.");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setFormError("Please enter a valid stock amount (0 or more).");
      return;
    }

    createProduct.mutate(
      { name: name.trim(), priceCents, stock: stockNum },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
          setStock("");
        },
      },
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-primary" />
          <h2 className="font-semibold">Add product</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="product-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Charger"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-price" className="text-sm font-medium">
              Price ($)
            </label>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-stock" className="text-sm font-medium">
              Stock
            </label>
            <Input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              className="w-20"
            />
          </div>
          <Button type="submit" disabled={createProduct.isPending}>
            {createProduct.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add product
          </Button>
        </form>

        {formError && (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {formError}
          </p>
        )}
        {createProduct.isError && (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {createProduct.error instanceof Error
              ? createProduct.error.message
              : "Could not create the product."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
