import { DiscountConfigService } from "../../config/discount.config";
import { Coupon } from "../../coupons/entities/coupon.entity";
import { CouponsRepository } from "../../coupons/repo/coupons.repository";
import { MilestoneTrackerService } from "../../coupons/milestone-tracker.service";
import { Order } from "../../orders/entities/order.entity";
import { OrdersRepository } from "../../orders/repo/orders.repository";
import { StatsService } from "../stats.service";

function makeStats(orders: Order[] = [], coupons: Coupon[] = []): StatsService {
  const ordersRepository = new OrdersRepository();
  const couponsRepository = new CouponsRepository();
  const config = new DiscountConfigService({
    DISCOUNT_N: "5",
    DISCOUNT_PERCENT: "10",
  });
  const milestoneTracker = new MilestoneTrackerService(config);

  for (const order of orders) {
    ordersRepository.save(order);
  }
  for (const coupon of coupons) {
    couponsRepository.save(coupon);
  }

  return new StatsService(
    ordersRepository,
    couponsRepository,
    milestoneTracker,
    config,
  );
}

describe("StatsService", () => {
  it("returns zero stats when there is no data", () => {
    const stats = makeStats().getStats();

    expect(stats.itemsPurchased).toBe(0);
    expect(stats.revenueCents).toBe(0);
    expect(stats.totalDiscountCents).toBe(0);
    expect(stats.coupons).toHaveLength(0);
    expect(stats.milestonesReached).toBe(0);
    expect(stats.milestones).toHaveLength(0);
    expect(stats.ordersToNextMilestone).toBe(5);
  });

  it("aggregates items purchased, revenue and discounts", () => {
    const order = new Order(
      "o1",
      [
        {
          productId: "phone",
          name: "Phone",
          unitPriceCents: 49999,
          quantity: 2,
          lineTotalCents: 99998,
        },
        {
          productId: "mouse",
          name: "Mouse",
          unitPriceCents: 2999,
          quantity: 3,
          lineTotalCents: 8997,
        },
      ],
      108995,
      500,
      108495,
      "ABC12345",
    );

    const stats = makeStats(
      [order],
      [new Coupon("ABC12345", 10, "used", 1)],
    ).getStats();

    expect(stats.itemsPurchased).toBe(5);
    expect(stats.revenueCents).toBe(108495);
    expect(stats.totalDiscountCents).toBe(500);
    expect(stats.coupons).toHaveLength(1);
    expect(stats.ordersToNextMilestone).toBe(4);
  });

  it("sums totals across multiple orders", () => {
    const stats = makeStats([
      new Order("o1", [], 1000, 0, 1000),
      new Order("o2", [], 2000, 100, 1900),
    ]).getStats();

    expect(stats.revenueCents).toBe(2900);
    expect(stats.totalDiscountCents).toBe(100);
  });
});
