import { InsufficientStockException } from "../../common/exceptions/insufficient-stock.exception";
import { ProductNotFoundException } from "../../common/exceptions/product-not-found.exception";
import { ProductsService } from "../products.service";

describe("ProductsService", () => {
  it("is seeded with a starter catalog", () => {
    const service = new ProductsService();
    expect(service.findAll().length).toBeGreaterThan(0);
    expect(service.findById("phone")).toBeDefined();
  });

  describe("create", () => {
    it("derives a slug id from the product name", () => {
      const service = new ProductsService();
      const product = service.create({
        name: "Wireless Mouse",
        priceCents: 1999,
        stock: 10,
      });

      expect(product.id).toBe("wireless-mouse");
      expect(product.name).toBe("Wireless Mouse");
    });

    it("disambiguates slug collisions with a numeric suffix", () => {
      const service = new ProductsService();
      const first = service.create({
        name: "Phone",
        priceCents: 999,
        stock: 1,
      });
      const second = service.create({
        name: "Phone",
        priceCents: 1000,
        stock: 2,
      });

      expect(first.id).toBe("phone-2");
      expect(second.id).toBe("phone-3");
    });
  });

  describe("update", () => {
    it("applies a partial update", () => {
      const service = new ProductsService();
      const updated = service.update("phone", { stock: 3 });

      expect(updated.stock).toBe(3);
      expect(updated.priceCents).toBe(49999);
    });

    it("throws for an unknown product", () => {
      const service = new ProductsService();
      expect(() => service.update("missing", { stock: 1 })).toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe("assertStockAvailable / decrementStock", () => {
    it("throws when stock is insufficient", () => {
      const service = new ProductsService();
      expect(() => service.assertStockAvailable("laptop", 99)).toThrow(
        InsufficientStockException,
      );
    });

    it("decrements stock after an order", () => {
      const service = new ProductsService();
      const before = service.findById("laptop")?.stock ?? 0;

      service.decrementStock("laptop", 2);

      expect(service.findById("laptop")?.stock).toBe(before - 2);
    });

    it("never lets stock drop below zero", () => {
      const service = new ProductsService();
      expect(() => service.decrementStock("laptop", 999)).toThrow(
        InsufficientStockException,
      );
    });
  });
});
