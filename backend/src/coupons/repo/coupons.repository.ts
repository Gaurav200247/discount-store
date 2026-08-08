import { Injectable, Logger } from "@nestjs/common";
import { Coupon } from "../entities/coupon.entity";

@Injectable()
export class CouponsRepository {
  private readonly logger = new Logger(CouponsRepository.name);

  private readonly coupons = new Map<string, Coupon>();

  save(coupon: Coupon): void {
    if (this.coupons.has(coupon.code)) {
      this.logger.error(`Coupon code collision: ${coupon.code}`);
      throw new Error(`Coupon code collision: ${coupon.code}`);
    }

    this.coupons.set(coupon.code, coupon);

    this.logger.verbose(`Saved coupon ${coupon.code} in repository`);
  }

  findByCode(code: string): Coupon | undefined {
    return this.coupons.get(code);
  }

  findAll(): Coupon[] {
    return [...this.coupons.values()];
  }
}
