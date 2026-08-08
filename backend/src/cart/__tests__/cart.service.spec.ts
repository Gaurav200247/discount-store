import { EmptyCartException } from "../../common/exceptions/empty-cart.exception";
import { InsufficientStockException } from "../../common/exceptions/insufficient-stock.exception";
import { ProductsService } from "../../products/products.service";
import { CartRepository } from "../repo/cart.repository";
import { CartService } from "../cart.service";

function makeService(): CartService {
  return new CartService(new CartRepository(), new ProductsService());
}

describe("CartService", () => {
  describe("addItem", () => {
    it("creates a new cart when no cartId is provided", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);

      expect(cart.id).toBeDefined();
      expect(cart.items).toEqual([{ productId: "phone", quantity: 1 }]);
    });

    it("adds to an existing cart and accumulates quantity", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);

      const updated = service.addItem(cart.id, "phone", 2);

      expect(updated.items).toEqual([{ productId: "phone", quantity: 3 }]);
    });

    it("rejects quantities that exceed stock", () => {
      const service = makeService();
      expect(() => service.addItem(undefined, "laptop", 999)).toThrow(
        InsufficientStockException,
      );
    });
  });

  describe("setItemQuantity", () => {
    it("adds a new line item if the product is not in the cart", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);

      const updated = service.setItemQuantity(cart.id, "mouse", 4);

      expect(updated.items).toHaveLength(2);
    });

    it("overwrites the quantity of an existing line item", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);

      const updated = service.setItemQuantity(cart.id, "phone", 5);

      expect(updated.items).toEqual([{ productId: "phone", quantity: 5 }]);
    });
  });

  describe("removeItem", () => {
    it("removes a line item from the cart", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);
      service.addItem(cart.id, "mouse", 1);

      const updated = service.removeItem(cart.id, "phone");

      expect(updated.items.map((item) => item.productId)).toEqual(["mouse"]);
    });
  });

  describe("clearCart / getCart", () => {
    it("clears the cart entirely", () => {
      const service = makeService();
      const cart = service.addItem(undefined, "phone", 1);

      service.clearCart(cart.id);

      expect(() => service.getCart(cart.id)).toThrow(EmptyCartException);
    });

    it("throws for an unknown cart", () => {
      const service = makeService();
      expect(() => service.getCart("missing")).toThrow(EmptyCartException);
    });
  });
});
