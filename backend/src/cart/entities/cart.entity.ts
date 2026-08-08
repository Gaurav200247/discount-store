export interface CartItem {
  productId: string;
  quantity: number;
}

export class Cart {
  constructor(
    public readonly id: string,
    public readonly items: CartItem[] = [],
  ) {}
}
