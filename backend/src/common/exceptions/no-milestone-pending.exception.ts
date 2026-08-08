export class NoMilestonePendingException extends Error {
  constructor() {
    super("No coupon milestone is currently pending.");
    this.name = "NoMilestonePendingException";
  }
}
