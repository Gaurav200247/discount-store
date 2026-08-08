export class InsufficientStockException extends Error {
  constructor(
    public readonly productName: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient stock for ${productName}: ${requested} requested, only ${available} available.`,
    );
    this.name = "InsufficientStockException";
  }
}
