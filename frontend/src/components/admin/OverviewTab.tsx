import {
  AlertTriangle,
  BadgePercent,
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
import { useStats } from "@/lib/queries";

export function OverviewTab() {
  const { data: stats, isLoading, isError, refetch } = useStats();

  return (
    <div className="flex flex-col gap-6">
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
                <h2 className="font-semibold">Milestones reached</h2>
                <Badge variant="outline">
                  {stats?.milestonesReached ?? 0} reached
                </Badge>
              </div>
              {stats && stats.milestones.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No milestones reached yet. Coupons are generated automatically
                  on every milestone order.
                </p>
              ) : (
                <ul className="divide-y">
                  {stats?.milestones.map((entry) => (
                    <li
                      key={entry.milestone}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge variant="secondary">
                          Milestone {entry.milestone}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          order #{entry.orderNumber}
                        </span>
                      </div>
                      {entry.coupon ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {entry.coupon.code}
                          </span>
                          <Badge
                            variant={
                              entry.coupon.status === "used"
                                ? "outline"
                                : "default"
                            }
                          >
                            {entry.coupon.status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          no coupon
                        </span>
                      )}
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
