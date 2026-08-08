export interface OrderLineItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export class Order {
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
