import { Injectable, Logger } from "@nestjs/common";
import { Money } from "../common/money";
import { CouponsRepository } from "../coupons/repo/coupons.repository";
import { OrdersRepository } from "../orders/repo/orders.repository";

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly couponsRepository: CouponsRepository,
  ) {}

  getStats() {
    const orders = this.ordersRepository.findAll();

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

    const coupons = this.couponsRepository.findAll();

    this.logger.log(
      `Stats fetched: ${orders.length} order(s), ${itemsPurchased} item(s), revenue ${revenueCents}c, discounts ${totalDiscountCents}c, ${coupons.length} coupon(s)`,
    );

    return {
      itemsPurchased,
      revenueCents,
      coupons,
      totalDiscountCents,
    };
  }
}
