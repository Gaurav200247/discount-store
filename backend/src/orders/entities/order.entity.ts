import { Coupon } from "../../coupons/entities/coupon.entity";

export interface OrderLineItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export class Order {
  public earnedCoupon?: Coupon;

  constructor(
    public readonly id: string,
    public readonly lineItems: OrderLineItem[],
    public readonly subtotalCents: number,
    public readonly discountCents: number,
    public readonly totalCents: number,
    public readonly couponCode?: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
