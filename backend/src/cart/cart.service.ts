import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { EmptyCartException } from "../common/exceptions/empty-cart.exception";
import { ProductsService } from "../products/products.service";
import { CartRepository } from "./repo/cart.repository";
import { Cart } from "./entities/cart.entity";

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsService: ProductsService,
  ) {}

  addItem(
    cartId: string | undefined,
    productId: string,
    quantity: number,
  ): Cart {
    const resolvedCartId = cartId ?? randomUUID();

    const isNewCart = cartId === undefined;

    const cart = this.cartRepository.findOrCreate(resolvedCartId);

    if (isNewCart) {
      this.logger.log(`Created new cart ${cart.id}`);
    }

    const existing = cart.items.find((item) => item.productId === productId);
    const newQuantity = (existing?.quantity ?? 0) + quantity;
    this.productsService.assertStockAvailable(productId, newQuantity);

    if (existing) {
      existing.quantity = newQuantity;

      this.logger.log(
        `Cart ${cart.id}: +${quantity}x ${productId} (quantity now ${existing.quantity})`,
      );
    } else {
      cart.items.push({ productId, quantity });

      this.logger.log(`Cart ${cart.id}: added ${quantity}x ${productId}`);
    }

    this.cartRepository.save(cart);

    return cart;
  }

  getCart(cartId: string): Cart {
    const cart = this.cartRepository.getById(cartId);

    if (!cart) {
      this.logger.warn(`Cart not found: ${cartId}`);
      throw new EmptyCartException();
    }

    this.logger.verbose(
      `Fetched cart ${cart.id} (${cart.items.length} line items)`,
    );

    return cart;
  }

  removeItem(cartId: string, productId: string): Cart {
    const cart = this.getCart(cartId);

    const index = cart.items.findIndex((item) => item.productId === productId);

    if (index !== -1) {
      cart.items.splice(index, 1);
      this.cartRepository.save(cart);

      this.logger.log(`Cart ${cart.id}: removed ${productId}`);
    }

    return cart;
  }

  setItemQuantity(cartId: string, productId: string, quantity: number): Cart {
    this.productsService.assertStockAvailable(productId, quantity);
    const cart = this.getCart(cartId);

    const item = cart.items.find((entry) => entry.productId === productId);

    if (item) {
      item.quantity = quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    this.cartRepository.save(cart);

    this.logger.log(
      `Cart ${cart.id}: set ${productId} quantity to ${quantity}`,
    );

    return cart;
  }

  clearCart(cartId: string): void {
    this.getCart(cartId);
    this.cartRepository.clear(cartId);

    this.logger.log(`Cart ${cartId}: cleared`);
  }
}
