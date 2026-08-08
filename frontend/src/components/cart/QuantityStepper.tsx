import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
}

export function QuantityStepper({
  quantity,
  onChange,
  max,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3" />
      </Button>

      <span className="w-10 text-center text-sm font-medium tabular-nums">
        {quantity}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => onChange(quantity + 1)}
        disabled={max !== undefined && quantity >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
