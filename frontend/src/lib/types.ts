export interface Product {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface OrderLineItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  lineItems: OrderLineItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponCode?: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  status: "unused" | "used";
  issuedAtMilestone: number;
}

export interface DiscountConfig {
  n: number;
  percent: number;
}

export interface Stats {
  itemsPurchased: number;
  revenueCents: number;
  coupons: Coupon[];
  totalDiscountCents: number;
}
