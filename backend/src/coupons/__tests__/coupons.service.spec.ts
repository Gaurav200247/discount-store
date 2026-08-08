import { InvalidCouponException } from "../../common/exceptions/invalid-coupon.exception";
import { NoMilestonePendingException } from "../../common/exceptions/no-milestone-pending.exception";
import { DiscountConfigService } from "../../config/discount.config";
import { CouponsRepository } from "../repo/coupons.repository";
import { CouponsService } from "../coupons.service";
import { MilestoneTrackerService } from "../milestone-tracker.service";

function makeHarness(n = 3) {
  const config = new DiscountConfigService({
    DISCOUNT_N: String(n),
    DISCOUNT_PERCENT: "10",
  });
  const tracker = new MilestoneTrackerService(config);
  const repository = new CouponsRepository();
  const service = new CouponsService(repository, tracker, config);
  return { service, tracker, repository };
}

describe("CouponsService", () => {
  describe("generate", () => {
    it("generates an 8-character coupon at the nth order", () => {
      const { service, tracker } = makeHarness();
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }

      const coupon = service.generate();

      expect(coupon.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(coupon.discountPercent).toBe(10);
      expect(coupon.status).toBe("unused");
      expect(coupon.issuedAtMilestone).toBe(1);
    });

    it("throws when no milestone is pending", () => {
      const { service } = makeHarness();
      expect(() => service.generate()).toThrow(NoMilestonePendingException);
    });

    it("issues only one coupon per milestone", () => {
      const { service, tracker } = makeHarness();
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }
      service.generate();
      expect(() => service.generate()).toThrow(NoMilestonePendingException);
    });

    it("persists the generated coupon", () => {
      const { service, tracker, repository } = makeHarness();
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }
      const coupon = service.generate();
      expect(repository.findByCode(coupon.code)).toBeDefined();
    });
  });

  describe("redeem", () => {
    it("rejects an unknown code", () => {
      const { service } = makeHarness();
      expect(() => service.redeem("UNKNOWN1")).toThrow(InvalidCouponException);
    });

    it("marks a coupon used on first redemption", () => {
      const { service, tracker, repository } = makeHarness();
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }
      const coupon = service.generate();

      const redeemed = service.redeem(coupon.code);

      expect(redeemed.status).toBe("used");
      expect(repository.findByCode(coupon.code)?.status).toBe("used");
    });

    it("rejects a coupon that was already used", () => {
      const { service, tracker } = makeHarness();
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }
      const coupon = service.generate();
      service.redeem(coupon.code);

      expect(() => service.redeem(coupon.code)).toThrow(InvalidCouponException);
    });
  });
});
