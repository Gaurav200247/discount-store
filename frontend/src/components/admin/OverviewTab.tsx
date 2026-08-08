import { useState } from "react";
import {
  AlertTriangle,
  BadgePercent,
  Loader2,
  Package,
  RefreshCw,
  Ticket,
  Wallet,
} from "lucide-react";

import { DiscountRuleCard } from "@/components/admin/DiscountRuleCard";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { useGenerateCoupon, useStats } from "@/lib/queries";

export function OverviewTab() {
  const { data: stats, isLoading, isError, refetch } = useStats();
  const generateCoupon = useGenerateCoupon();
  const [generated, setGenerated] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Coupon generation</p>
            <p className="text-sm text-muted-foreground">
              Issues a coupon whenever a milestone order count has been reached.
            </p>
          </div>
          <Button
            onClick={() =>
              generateCoupon.mutate(undefined, {
                onSuccess: (coupon) => setGenerated(coupon.code),
              })
            }
            disabled={generateCoupon.isPending}
            className="sm:w-auto"
          >
            {generateCoupon.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ticket className="size-4" />
            )}
            Generate coupon
          </Button>
        </CardContent>
      </Card>

      {generateCoupon.isError && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <span className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {generateCoupon.error instanceof Error
              ? generateCoupon.error.message
              : "Could not generate a coupon."}
          </span>
        </div>
      )}

      {generated && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-primary">
            <Ticket className="size-4 shrink-0" />
            Coupon generated:{" "}
            <span className="font-mono font-semibold">{generated}</span>
          </span>
          <button
            onClick={() => setGenerated(null)}
            aria-label="Dismiss"
            className="text-primary/70 hover:text-primary"
          >
            ×
          </button>
        </div>
      )}

      <DiscountRuleCard />

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="font-medium">Couldn't load store stats</p>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="gap-2">
              <CardContent className="px-4 py-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Package}
              label="Items purchased"
              value={String(stats?.itemsPurchased ?? 0)}
            />
            <StatCard
              icon={Wallet}
              label="Revenue"
              value={formatPrice(stats?.revenueCents ?? 0)}
            />
            <StatCard
              icon={BadgePercent}
              label="Total discounts"
              value={formatPrice(stats?.totalDiscountCents ?? 0)}
            />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4 px-4 py-4">
              <div className="flex items-center gap-2">
                <Ticket className="size-4 text-primary" />
                <h2 className="font-semibold">Coupons</h2>
                <Badge variant="outline">
                  {stats?.coupons.length ?? 0} issued
                </Badge>
              </div>
              {stats && stats.coupons.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No coupons issued yet. Place a few orders, then generate a
                  coupon above.
                </p>
              ) : (
                <ul className="divide-y">
                  {stats?.coupons.map((coupon) => (
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
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          milestone {coupon.issuedAtMilestone}
                        </span>
                        <Badge
                          variant={
                            coupon.status === "used" ? "outline" : "default"
                          }
                        >
                          {coupon.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
