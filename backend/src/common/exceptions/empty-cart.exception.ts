export class EmptyCartException extends Error {
  constructor() {
    super("Cart is empty or does not exist.");
    this.name = "EmptyCartException";
  }
}
