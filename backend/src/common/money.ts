export class Money {
  static add(a: number, b: number): number {
    return a + b;
  }

  static subtract(a: number, b: number): number {
    return a - b;
  }

  static sum(amounts: number[]): number {
    return amounts.reduce((acc, amount) => acc + amount, 0);
  }

  static multiply(amountCents: number, factor: number): number {
    return amountCents * factor;
  }

  static percentOf(amountCents: number, percent: number): number {
    return Math.floor((amountCents * percent) / 100);
  }
}
