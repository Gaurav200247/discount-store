export class InvalidCouponException extends Error {
  constructor(code: string) {
    super(`Invalid or already-used coupon: ${code}`);
    this.name = "InvalidCouponException";
  }
}
