export type CouponStatus = "unused" | "used";

export class Coupon {
  constructor(
    public readonly code: string,
    public readonly discountPercent: number,
    public status: CouponStatus,
    public readonly issuedAtMilestone: number,
  ) {}
}
