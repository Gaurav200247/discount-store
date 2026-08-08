import { Injectable, Logger } from "@nestjs/common";
import { Cart } from "../entities/cart.entity";

@Injectable()
export class CartRepository {
  private readonly logger = new Logger(CartRepository.name);

  private readonly carts = new Map<string, Cart>();

  findOrCreate(cartId: string): Cart {
    let cart = this.carts.get(cartId);
    if (!cart) {
      cart = new Cart(cartId);
      this.carts.set(cartId, cart);
      this.logger.verbose(`Created cart entry ${cartId} in repository`);
    }
    return cart;
  }

  getById(cartId: string): Cart | undefined {
    return this.carts.get(cartId);
  }

  save(cart: Cart): void {
    this.carts.set(cart.id, cart);
    this.logger.verbose(`Saved cart ${cart.id} in repository`);
  }

  clear(cartId: string): void {
    this.carts.delete(cartId);
    this.logger.verbose(`Removed cart ${cartId} from repository`);
  }
}
