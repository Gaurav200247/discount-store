import { CartRepository } from "../../cart/repo/cart.repository";
import { CartService } from "../../cart/cart.service";
import { EmptyCartException } from "../../common/exceptions/empty-cart.exception";
import { InsufficientStockException } from "../../common/exceptions/insufficient-stock.exception";
import { DiscountConfigService } from "../../config/discount.config";
import { Coupon } from "../../coupons/entities/coupon.entity";
import { CouponsService } from "../../coupons/coupons.service";
import { MilestoneTrackerService } from "../../coupons/milestone-tracker.service";
import { ProductsService } from "../../products/products.service";
import { OrdersRepository } from "../repo/orders.repository";
import { OrdersService } from "../orders.service";

function makeHarness(n = 5) {
  const cartRepository = new CartRepository();
  const productsService = new ProductsService();
  const cartService = new CartService(cartRepository, productsService);
  const config = new DiscountConfigService({
    DISCOUNT_N: String(n),
    DISCOUNT_PERCENT: "10",
  });
  const milestoneTracker = new MilestoneTrackerService(config);
  const redeem = jest.fn();
  const couponsService = { redeem } as unknown as CouponsService;
  const ordersRepository = new OrdersRepository();
  const ordersService = new OrdersService(
    cartService,
    cartRepository,
    productsService,
    couponsService,
    milestoneTracker,
    ordersRepository,
  );

  return {
    ordersService,
    cartService,
    productsService,
    milestoneTracker,
    ordersRepository,
    redeem,
  };
}

describe("OrdersService", () => {
  describe("findAll", () => {
    it("returns orders newest first", () => {
      const { ordersService, cartService } = makeHarness();
      const cartA = cartService.addItem(undefined, "phone", 1);
      const cartB = cartService.addItem(undefined, "mouse", 1);
      const first = ordersService.checkout({ cartId: cartA.id });
      const second = ordersService.checkout({ cartId: cartB.id });

      const orders = ordersService.findAll();

      expect(orders.map((order) => order.id)).toEqual([second.id, first.id]);
    });
  });

  describe("checkout", () => {
    it("rejects an empty or missing cart", () => {
      const { ordersService } = makeHarness();
      expect(() => ordersService.checkout({ cartId: "missing" })).toThrow(
        EmptyCartException,
      );
    });

    it("places an order without a coupon", () => {
      const { ordersService, cartService, ordersRepository } = makeHarness();
      const cart = cartService.addItem(undefined, "phone", 2);

      const order = ordersService.checkout({ cartId: cart.id });

      expect(order.lineItems).toHaveLength(1);
      expect(order.subtotalCents).toBe(49999 * 2);
      expect(order.discountCents).toBe(0);
      expect(order.totalCents).toBe(49999 * 2);
      expect(order.couponCode).toBeUndefined();
      expect(ordersRepository.findAll()).toHaveLength(1);
    });

    it("applies a coupon discount at checkout", () => {
      const { ordersService, cartService, redeem } = makeHarness();
      redeem.mockReturnValue(new Coupon("ABC12345", 10, "used", 1));
      const cart = cartService.addItem(undefined, "mouse", 1); // 2999c

      const order = ordersService.checkout({
        cartId: cart.id,
        couponCode: "ABC12345",
      });

      expect(redeem).toHaveBeenCalledWith("ABC12345");
      expect(order.subtotalCents).toBe(2999);
      expect(order.discountCents).toBe(Math.floor((2999 * 10) / 100)); // 299
      expect(order.totalCents).toBe(2700);
      expect(order.couponCode).toBe("ABC12345");
    });

    it("decrements stock and clears the cart after checkout", () => {
      const { ordersService, cartService, productsService } = makeHarness();
      const before = productsService.findById("phone")?.stock ?? 0;
      const cart = cartService.addItem(undefined, "phone", 2);

      ordersService.checkout({ cartId: cart.id });

      expect(productsService.findById("phone")?.stock).toBe(before - 2);
      expect(() => cartService.getCart(cart.id)).toThrow(EmptyCartException);
    });

    it("records every order against the milestone tracker", () => {
      const { ordersService, cartService, milestoneTracker } = makeHarness(1);
      const cart = cartService.addItem(undefined, "phone", 1);

      ordersService.checkout({ cartId: cart.id });

      expect(milestoneTracker.currentMilestone()).toBe(1);
    });

    it("fails the whole order when stock runs out after adding to cart", () => {
      const { ordersService, cartService, productsService } = makeHarness();
      const cart = cartService.addItem(undefined, "laptop", 5); // all 5 in stock
      productsService.decrementStock("laptop", 5); // stock depleted elsewhere

      expect(() => ordersService.checkout({ cartId: cart.id })).toThrow(
        InsufficientStockException,
      );
      expect(() => cartService.getCart(cart.id)).not.toThrow();
    });
  });
});
