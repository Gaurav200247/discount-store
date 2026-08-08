import { useState } from "react";
import { Package, TrendingUp } from "lucide-react";

import { OverviewTab } from "@/components/admin/OverviewTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { cn } from "@/lib/utils";

type Tab = "overview" | "products";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>

        <nav
          aria-label="Admin sections"
          className="inline-flex items-center gap-1 rounded-full border bg-muted/60 p-1"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {id === "overview" && <TrendingUp className="size-3.5" />}
              {id === "products" && <Package className="size-3.5" />}
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "overview" ? <OverviewTab /> : <ProductsTab />}
    </div>
  );
}
