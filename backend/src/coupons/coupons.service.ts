import { randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { InvalidCouponException } from "../common/exceptions/invalid-coupon.exception";
import { DiscountConfigService } from "../config/discount.config";
import { CouponsRepository } from "./repo/coupons.repository";
import { Coupon } from "./entities/coupon.entity";
import { MilestoneTrackerService } from "./milestone-tracker.service";

function generateCode(): string {
  const value = randomBytes(6).readUIntBE(0, 6);
  return value.toString(36).toUpperCase().padStart(8, "0").slice(-8);
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly milestoneTracker: MilestoneTrackerService,
    private readonly config: DiscountConfigService,
  ) {}

  generate(): Coupon {
    const coupon = new Coupon(
      generateCode(),
      this.config.percent,
      "unused",
      this.milestoneTracker.currentMilestone(),
    );

    this.couponsRepository.save(coupon);

    this.logger.log(
      `Generated coupon ${coupon.code} (${coupon.discountPercent}% off) for milestone ${coupon.issuedAtMilestone}`,
    );

    return coupon;
  }

  redeem(code: string): Coupon {
    const coupon = this.couponsRepository.findByCode(code);

    if (!coupon || coupon.status === "used") {
      this.logger.warn(`Coupon rejected: ${code} (invalid or already used)`);
      throw new InvalidCouponException(code);
    }

    coupon.status = "used";

    this.logger.log(`Coupon ${code} redeemed (marked used)`);

    return coupon;
  }
}
