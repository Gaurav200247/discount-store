# Ecommerce Discount System — Design

## 1. Actors

- **Customer** — adds items to cart, checks out, applies discount codes.
- **Store Owner (Admin)** — generates discount codes when eligible, views store stats.
- **System** — tracks orders, evaluates the nth-order rule, validates and redeems coupons.

---

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| D1 | nth order counted globally vs per-customer | **Global** — counter increments on every successful checkout |
| D2 | Coupon generated on-demand vs auto-issued | **On-demand** — admin calls `generate`, matches assignment wording |
| D3 | Invalid code at checkout → block vs proceed without discount | **Block the order** — stricter, simpler, easier to test |
| D4 | Coupon single-use, no expiry | **Single-use, no expiry** |
| D5 | `n` and `x%` configurable, validated at boot | **Yes** — via config/env. Bounds locked at boot: `n >= 1`, `0 < x < 100` (upper bound prevents `x = 100` silently producing free orders) |
| D6 | Money representation | **Integer cents**, all math centralized in `Money` |
| D7 | Coupon issuance per milestone | **One per milestone** — second `generate()` call before next milestone throws `409` |
| D8 | Concurrency assumption | **In-memory + synchronous/single-threaded** — no concurrent requests assumed |
| D9 | "Items purchased" definition | **Total unit count** = sum of line-item quantities across orders |
| D10 | Coupon status model | `unused → used`, transition enforced inside `redeem()` |
| D11 | Redemption-before-persistence risk | Coupon is marked `used` **before** the order object is constructed. Accepted given D8 (no rollback needed) — if `Order` construction ever threw after redemption, the code would be burned with no order. Noted, not fixed, because it cannot occur in the synchronous in-memory flow used here. |
| D12 | Milestone claiming strategy | **Sequential, not jump-to-latest.** `generate()` claims `lastIssuedMilestone + 1`, never skips ahead to `currentMilestone()`. Prevents silently forfeiting a milestone's coupon if admin doesn't call `generate()` between milestones. Check-and-claim is a single atomic `claimNextMilestone()` call, so the invariant holds by construction, not by convention |
| D13 | Product validation timing | Validated **at `addItem()`**, not at checkout. A cart can never hold an unknown `productId` — keeps invariants at the data-entry boundary rather than deferring the check downstream |
| D14 | Discount rounding direction | `Money.percentOf` uses `Math.floor(amount * percent / 100)` — discount never exceeds the stated `x%`. Rounds in the store's favor by construction |
| D15 | ID / code generation | Cart and order IDs: `crypto.randomUUID()`. Coupon codes: 8-char base36 from `crypto.randomBytes`, collision-checked against the repository on generate |
| D16 | Admin endpoint auth | **None implemented.** Out of scope for this exercise; called out explicitly here so it reads as a conscious omission, not a gap |

---

## 3. Checkout sequencing (the critical path)

`orders.service.checkout(dto)` runs these steps **in order**, synchronously, in a single method — nothing here is atomic via a transaction, it's atomic because it's one un-interrupted function call:

```
1. cart = cartService.getCart(dto.cartId)
      → throw EmptyCartException if missing/empty        (S5)

2. lineItems = price(cart)  // via productsService + Money
   subtotal = Money.sum(lineItems.map(li => li.lineTotalCents))

3. if dto.couponCode:
      coupon = couponsService.redeem(dto.couponCode)      (S3/S4/S10)
        → throws InvalidCouponException if missing/used   (S4, blocks order — D3)
        → on success: coupon.status = 'used'               (D10)
      discount = Money.percentOf(subtotal, coupon.discountPercent)
   else:
      discount = 0

4. total = subtotal - discount
   order  = ordersRepository.save({ lineItems, subtotal, discount, total, couponCode })

5. milestoneTracker.recordOrder()                          (S6 — only after order persisted)

6. cartRepository.clear(dto.cartId)                        (S1 cleanup, internal only)

7. return order
```

Step ordering rationale:
- Cart emptiness is checked **before** coupon redemption, so an invalid request never burns a coupon — cart check must precede redeem.
- Milestone increment is **last**, after persistence, so a failed checkout never bumps the global counter.
- Coupon redemption happens **before** order persistence (D11) — accepted risk, documented rather than engineered around, since D8 makes it moot in practice.

---

## 4. Entities

### Product
```ts
{ id: string, name: string, priceCents: number }
```

### Cart
```ts
{
  id: string,
  items: Array<{ productId: string, quantity: number }>
}
```

### Order (D9, D6)
```ts
{
  id: string,
  lineItems: Array<{
    productId: string,
    name: string,
    unitPriceCents: number,
    quantity: number,
    lineTotalCents: number
  }>,
  subtotalCents: number,
  discountCents: number,
  totalCents: number,
  couponCode?: string,
  createdAt: Date
}
```

### Coupon (D10)
```ts
{
  code: string,
  discountPercent: number,
  status: 'unused' | 'used',
  issuedAtMilestone: number   // which nth-order milestone generated this code
}
```

---

## 5. Service method signatures

### `cart.service.ts`
```ts
addItem(cartId: string | undefined, productId: string, quantity: number): Cart
  // cartId undefined → cartRepository.findOrCreate(randomUUID())            (D15)
  // D13: throws ProductNotFoundException if productsService can't resolve productId —
  //       validated HERE, not at checkout, so a cart can never hold an unknown product

getCart(cartId: string): Cart
```

### `cart.repository.ts`
```ts
findOrCreate(cartId: string): Cart
save(cart: Cart): void
clear(cartId: string): void
```

### `coupons.service.ts`
```ts
// S3/S4/S10 — validate + redeem in one atomic call
redeem(code: string): Coupon
  // throws InvalidCouponException if not found or status === 'used'

// S8/D7/D12 — throws, never silently no-ops, claims exactly one milestone
generate(): Coupon
  // milestone = milestoneTracker.claimNextMilestone()
  // if (milestone === null) throw NoMilestonePendingException (→ 409)
  // otherwise:
  //   coupon = { code: generateCode(), discountPercent: config.x, status: 'unused', issuedAtMilestone: milestone }
  //   couponsRepository.save(coupon)
  //   return coupon
```

### `milestone-tracker.service.ts`
```ts
recordOrder(): void
  // increments global order counter (S6)

// D12 — sequential claiming, never jumps to the latest milestone.
// Check and claim are one atomic call, so they can never desync.
claimNextMilestone(): number | null
  // if (lastIssuedMilestone + 1) <= floor(orderCount / n):
  //   lastIssuedMilestone += 1
  //   return lastIssuedMilestone
  // else:
  //   return null   // nothing to claim

currentMilestone(): number
  // floor(orderCount / n) — for reference/debugging only, not used in claim logic
lastIssuedMilestone: number   // internal state, mutated only inside claimNextMilestone()
```

Admin calling `generate()` repeatedly with no new orders in between will correctly throw `NoMilestonePendingException` every time after the backlog is drained — each call claims exactly one milestone, so N unclaimed milestones require N calls, and no coupon is ever skipped.

### `orders.service.ts`
```ts
checkout(dto: CheckoutDto): Order
  // orchestrates the 7-step sequence in §3 — no business rules of its own
```

### `stats.service.ts`
```ts
getStats(): {
  itemsPurchased: number,      // plain reduce over lineItem quantities — NOT Money (quantities aren't currency)
  revenueCents: number,        // Money.sum of all order.totalCents
  coupons: Coupon[],           // all generated codes + status
  totalDiscountCents: number   // Money.sum of all order.discountCents
}
```
`Money` is reserved for cents-denominated values only. Unit counts (D9) use plain arithmetic — mixing the two would violate the "no inline arithmetic outside Money" rule in spirit, since `Money` exists to enforce cents-safety, not as a generic sum helper.

### `money.ts` (D6 — single source of truth for all cents math)
```ts
percentOf(amountCents: number, percent: number): number
  // Math.floor(amountCents * percent / 100) — D14: rounds down, discount never exceeds x%

add(a: number, b: number): number
sum(amounts: number[]): number
subtract(a: number, b: number): number
```
Both `coupons.service.ts` (discount calc) and `stats.service.ts` (revenue, total discounts) must call into this — no inline cents arithmetic anywhere else. (Plain unit counts, e.g. `itemsPurchased`, are out of scope for `Money` — see §5 `stats.service.ts`.)

---

## 6. DTOs

```ts
// add-item.dto.ts
{ cartId?: string, productId: string, quantity: number }
// cartId omitted → cart.service.addItem creates a new cart (see §5 signature)

// checkout.dto.ts
{ cartId: string, couponCode?: string }
```

---

## 7. Module structure & dependency direction

```
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── config.module.ts
│   └── discount.config.ts          # n, x% — validated at boot (D5: n>=1, 0<x<100)
│
├── common/
│   ├── money.ts                    # D6 — all money math
│   ├── exceptions/
│   │   ├── empty-cart.exception.ts
│   │   ├── invalid-coupon.exception.ts
│   │   ├── no-milestone-pending.exception.ts
│   │   └── product-not-found.exception.ts   # D13 — thrown by cart.service.addItem
│   └── filters/
│       └── http-exception.filter.ts   # maps each exception → correct status code
│
├── products/
│   ├── products.module.ts
│   ├── products.service.ts
│   ├── products.controller.ts      # GET /products
│   └── entities/product.entity.ts
│
├── cart/
│   ├── cart.module.ts
│   ├── cart.controller.ts          # POST /cart/items, GET /cart/:id
│   ├── cart.service.ts
│   ├── cart.repository.ts
│   ├── dto/add-item.dto.ts
│   └── entities/cart.entity.ts
│
├── coupons/
│   ├── coupons.module.ts
│   ├── coupons.controller.ts       # POST /admin/coupons
│   ├── coupons.service.ts
│   ├── coupons.repository.ts
│   ├── milestone-tracker.service.ts
│   └── entities/coupon.entity.ts
│
├── orders/
│   ├── orders.module.ts            # imports CartModule + CouponsModule
│   ├── orders.controller.ts        # POST /checkout
│   ├── orders.service.ts
│   ├── orders.repository.ts
│   ├── dto/checkout.dto.ts
│   └── entities/order.entity.ts
│
└── stats/
    ├── stats.module.ts             # imports OrdersModule + CouponsModule (read-only)
    ├── stats.controller.ts         # GET /admin/stats
    └── stats.service.ts
```

**Provider exports** (required for `stats` to read data):
- `OrdersModule` must export `OrdersRepository` (stats reads all orders).
- `CouponsModule` must export `CouponsRepository` (stats reads all codes + status).

**Dependency direction (no cycles):**
`orders → cart`, `orders → coupons`, `stats → orders`, `stats → coupons`.
`coupons` and `cart` never import `orders` — this is what keeps checkout orchestration in one place without circular imports.

**HTTP status mapping** (via `http-exception.filter`):
| Exception | Status |
|---|---|
| `EmptyCartException` | 400 |
| `InvalidCouponException` | 400 |
| `NoMilestonePendingException` | 409 |
| `ProductNotFoundException` | 404 |

---

## 8. API surface

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/cart/items` | `{ cartId?, productId, quantity }` | creates cart if `cartId` omitted; `404` if product unknown (D13) |
| GET | `/cart/:id` | — | |
| POST | `/checkout` | `{ cartId, couponCode? }` | S2/S3/S4/S5 |
| POST | `/admin/coupons` | — | S8 — `409` if no milestone pending (D7/D12) |
| GET | `/admin/stats` | — | S9 |

---

## 9. Open items intentionally deferred

- Idempotency key for double form-submits — moot under D8 (single-threaded, in-memory); one-line note in DECISIONS.md is sufficient.
- Swagger/Postman collection — optional, add if time permits for reviewer convenience.
