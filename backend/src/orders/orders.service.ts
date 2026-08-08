import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { CartRepository } from "../cart/repo/cart.repository";
import { CartService } from "../cart/cart.service";
import { EmptyCartException } from "../common/exceptions/empty-cart.exception";
import { Money } from "../common/money";
import { CouponsService } from "../coupons/coupons.service";
import { MilestoneTrackerService } from "../coupons/milestone-tracker.service";
import { ProductsService } from "../products/products.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { Order, OrderLineItem } from "./entities/order.entity";
import { OrdersRepository } from "./repo/orders.repository";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cartRepository: CartRepository,
    private readonly productsService: ProductsService,
    private readonly couponsService: CouponsService,
    private readonly milestoneTracker: MilestoneTrackerService,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  findAll(): Order[] {
    return [...this.ordersRepository.findAll()].reverse();
  }

  checkout(dto: CheckoutDto): Order {
    const cart = this.cartService.getCart(dto.cartId);
    if (cart.items.length === 0) {
      this.logger.warn(
        `Checkout rejected for cart ${dto.cartId}: cart is empty`,
      );
      throw new EmptyCartException();
    }

    const lineItems: OrderLineItem[] = cart.items.map((item) => {
      const product = this.productsService.findByIdOrThrow(item.productId);
      return {
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        lineTotalCents: Money.multiply(product.priceCents, item.quantity),
      };
    });

    const subtotalCents = Money.sum(lineItems.map((li) => li.lineTotalCents));
    this.logger.log(
      `Checkout for cart ${cart.id}: ${lineItems.length} line item(s), subtotal ${subtotalCents}c`,
    );

    // Reserve stock for every line item before committing anything, so the whole
    // order either succeeds (stock decremented) or fails (nothing changes).
    for (const item of lineItems) {
      this.productsService.assertStockAvailable(item.productId, item.quantity);
    }

    let discountCents = 0;
    let couponCode: string | undefined;

    if (dto.couponCode !== undefined) {
      const coupon = this.couponsService.redeem(dto.couponCode);
      couponCode = coupon.code;
      discountCents = Money.percentOf(subtotalCents, coupon.discountPercent);
      this.logger.log(
        `Checkout for cart ${cart.id}: coupon ${coupon.code} applied, discount ${discountCents}c`,
      );
    }

    const totalCents = Money.subtract(subtotalCents, discountCents);

    const order = this.ordersRepository.save(
      new Order(
        randomUUID(),
        lineItems,
        subtotalCents,
        discountCents,
        totalCents,
        couponCode,
      ),
    );

    this.milestoneTracker.recordOrder();
    for (const item of lineItems) {
      this.productsService.decrementStock(item.productId, item.quantity);
    }

    this.cartRepository.clear(dto.cartId);

    this.logger.log(
      `Order ${order.id} placed: total ${totalCents}c (${lineItems.length} line item(s), discount ${discountCents}c${couponCode ? `, coupon ${couponCode}` : ""})`,
    );

    return order;
  }
}
