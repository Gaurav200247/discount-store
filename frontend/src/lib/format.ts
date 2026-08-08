const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/** Percentage of an amount in cents, rounded down to match the backend. */
export function percentOf(amountCents: number, percent: number): number {
  return Math.floor((amountCents * percent) / 100);
}
