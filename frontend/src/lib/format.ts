const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}
