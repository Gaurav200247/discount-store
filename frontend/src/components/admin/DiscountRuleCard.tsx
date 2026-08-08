import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Settings2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDiscountConfig, useUpdateDiscountConfig } from "@/lib/queries";

export function DiscountRuleCard() {
  const { data: config, isLoading } = useDiscountConfig();
  const updateConfig = useUpdateDiscountConfig();
  const [n, setN] = useState("");
  const [percent, setPercent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadedN = config?.n;
  const loadedPercent = config?.percent;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const input: { n?: number; percent?: number } = {};
    if (n.trim() !== "") {
      const nValue = Number(n);
      if (!Number.isInteger(nValue) || nValue < 1) {
        setFormError("N must be a whole number of at least 1.");
        return;
      }
      input.n = nValue;
    }
    if (percent.trim() !== "") {
      const pValue = Number(percent);
      if (!Number.isInteger(pValue) || pValue < 1 || pValue > 99) {
        setFormError("Percent must be a whole number between 1 and 99.");
        return;
      }
      input.percent = pValue;
    }
    if (Object.keys(input).length === 0) {
      return;
    }

    updateConfig.mutate(input, {
      onSuccess: () => {
        setN("");
        setPercent("");
      },
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-primary" />
          <h2 className="font-semibold">Discount rule</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Every{" "}
          <span className="font-medium text-foreground">
            {loadedN ?? "…"}th
          </span>{" "}
          order earns a{" "}
          <span className="font-medium text-foreground">
            {loadedPercent ?? "…"}%
          </span>{" "}
          coupon.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rule-n" className="text-sm font-medium">
              Every Nth order
            </label>
            <Input
              id="rule-n"
              type="number"
              min="1"
              step="1"
              value={n}
              onChange={(e) => setN(e.target.value)}
              placeholder={loadedN !== undefined ? String(loadedN) : "n"}
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rule-percent" className="text-sm font-medium">
              Discount percent
            </label>
            <Input
              id="rule-percent"
              type="number"
              min="1"
              max="99"
              step="1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder={
                loadedPercent !== undefined ? String(loadedPercent) : "10"
              }
              className="w-28"
            />
          </div>
          <Button type="submit" disabled={updateConfig.isPending || isLoading}>
            {updateConfig.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save rule
          </Button>
        </form>

        {formError && (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {formError}
          </p>
        )}
        {updateConfig.isError && (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {updateConfig.error instanceof Error
              ? updateConfig.error.message
              : "Could not update the discount rule."}
          </p>
        )}
        {updateConfig.isSuccess && !formError && (
          <p className="flex items-center gap-2 text-sm text-primary">
            <Ticket className="size-4" />
            Discount rule updated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
