export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly priceCents: number,
    public stock: number,
  ) {}
}
