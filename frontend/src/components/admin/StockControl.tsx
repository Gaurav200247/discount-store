import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUpdateProduct } from "@/lib/queries";

interface StockControlProps {
  id: string;
  stock: number;
}

export function StockControl({ id, stock }: StockControlProps) {
  const updateProduct = useUpdateProduct();
  const adjust = (delta: number) => {
    const next = Math.max(0, stock + delta);
    if (next !== stock) {
      updateProduct.mutate({ id, stock: next });
    }
  };

  return (
    <div className="inline-flex items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => adjust(-1)}
        disabled={stock === 0 || updateProduct.isPending}
        aria-label="Decrease stock"
      >
        <Minus className="size-3" />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">
        {stock}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => adjust(1)}
        disabled={updateProduct.isPending}
        aria-label="Increase stock"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
