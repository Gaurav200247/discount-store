import { Injectable, Logger } from "@nestjs/common";
import { Money } from "../common/money";
import { DiscountConfigService } from "../config/discount.config";
import { CouponsRepository } from "../coupons/repo/coupons.repository";
import { MilestoneTrackerService } from "../coupons/milestone-tracker.service";
import { OrdersRepository } from "../orders/repo/orders.repository";

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly couponsRepository: CouponsRepository,
    private readonly milestoneTracker: MilestoneTrackerService,
    private readonly config: DiscountConfigService,
  ) {}

  getStats() {
    const orders = this.ordersRepository.findAll();
    const coupons = this.couponsRepository.findAll();

    const itemsPurchased = orders.reduce(
      (sum, order) =>
        sum +
        order.lineItems.reduce((lineSum, item) => lineSum + item.quantity, 0),
      0,
    );

    const revenueCents = Money.sum(orders.map((order) => order.totalCents));
    const totalDiscountCents = Money.sum(
      orders.map((order) => order.discountCents),
    );

    const milestonesReached = this.milestoneTracker.currentMilestone();
    const milestones = Array.from({ length: milestonesReached }, (_, i) => {
      const milestone = i + 1;
      return {
        milestone,
        orderNumber: milestone * this.config.n,
        coupon:
          coupons.find((c) => c.issuedAtMilestone === milestone) ?? null,
      };
    });

    const orderCount = orders.length;
    const ordersToNextMilestone =
      this.config.n - (orderCount % this.config.n);

    this.logger.log(
      `Stats fetched: ${orderCount} order(s), ${itemsPurchased} item(s), revenue ${revenueCents}c, discounts ${totalDiscountCents}c, ${coupons.length} coupon(s), ${milestonesReached} milestone(s) reached`,
    );

    return {
      itemsPurchased,
      revenueCents,
      coupons,
      totalDiscountCents,
      milestonesReached,
      milestones,
      ordersToNextMilestone,
    };
  }
}
