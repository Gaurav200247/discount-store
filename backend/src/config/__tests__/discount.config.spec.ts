import { DiscountConfigService } from "../discount.config";

describe("DiscountConfigService", () => {
  it("uses defaults when env vars are missing", () => {
    const config = new DiscountConfigService({});
    expect(config.n).toBe(5);
    expect(config.percent).toBe(10);
  });

  it("reads DISCOUNT_N and DISCOUNT_PERCENT from env", () => {
    const config = new DiscountConfigService({
      DISCOUNT_N: "7",
      DISCOUNT_PERCENT: "15",
    });
    expect(config.n).toBe(7);
    expect(config.percent).toBe(15);
  });

  it("rejects a non-integer DISCOUNT_N at boot", () => {
    expect(() => new DiscountConfigService({ DISCOUNT_N: "abc" })).toThrow(
      /must be an integer/,
    );
  });

  it("rejects DISCOUNT_N below 1", () => {
    expect(() => new DiscountConfigService({ DISCOUNT_N: "0" })).toThrow(
      /DISCOUNT_N must be >= 1/,
    );
  });

  it("rejects DISCOUNT_PERCENT outside 0..100", () => {
    expect(
      () => new DiscountConfigService({ DISCOUNT_PERCENT: "100" }),
    ).toThrow(/0 < x < 100/);
    expect(() => new DiscountConfigService({ DISCOUNT_PERCENT: "0" })).toThrow(
      /0 < x < 100/,
    );
  });

  describe("update", () => {
    it("applies a partial runtime update", () => {
      const config = new DiscountConfigService({});
      config.update({ n: 3 });
      expect(config.n).toBe(3);
      expect(config.percent).toBe(10);
    });

    it("rejects an invalid runtime update", () => {
      const config = new DiscountConfigService({});
      expect(() => config.update({ percent: 0 })).toThrow(/0 < x < 100/);
      expect(() => config.update({ n: 0 })).toThrow(/DISCOUNT_N must be >= 1/);
    });
  });
});
