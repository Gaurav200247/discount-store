import { Money } from "../money";

describe("Money", () => {
  describe("add", () => {
    it("sums two integer-cent amounts", () => {
      expect(Money.add(100, 250)).toBe(350);
    });
  });

  describe("subtract", () => {
    it("subtracts one amount from another", () => {
      expect(Money.subtract(300, 40)).toBe(260);
    });
  });

  describe("sum", () => {
    it("sums an empty list to zero", () => {
      expect(Money.sum([])).toBe(0);
    });

    it("sums all amounts", () => {
      expect(Money.sum([100, 200, 350])).toBe(650);
    });
  });

  describe("multiply", () => {
    it("multiplies a unit price by a quantity", () => {
      expect(Money.multiply(4999, 3)).toBe(14997);
    });
  });

  describe("percentOf", () => {
    it("computes an exact percentage", () => {
      expect(Money.percentOf(1000, 10)).toBe(100);
    });

    it("floors fractional results (store-friendly rounding)", () => {
      expect(Money.percentOf(999, 10)).toBe(99);
    });

    it("never returns more than the stated percentage", () => {
      expect(Money.percentOf(1, 10)).toBe(0);
    });
  });
});
