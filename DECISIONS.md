# Design Decisions

This file documents the key design decisions made while building the ecommerce discount system. Each decision follows the **Context / Options / Choice / Why** format.

---

## Decision: Global vs. per-customer order counting

**Context:** The discount system rewards customers by issuing a coupon for every *n*th order. We had to decide what an "order" means for counting purposes.

**Options Considered:**

- Option A: Count orders globally — every successful checkout across all customers increments one shared counter.
- Option B: Count orders per customer — each customer gets their own counter, so every *n*th order by _that_ customer earns a coupon.

**Choice:** Option A — a single global counter incremented on every successful checkout.

**Why:** The assignment wording ("every *n*th order gets a coupon code") reads as a store-wide promotion rather than a per-customer loyalty scheme. A global counter is also simpler to implement, reason about, and test. Per-customer counting would require identifying customers (out of scope for the in-memory exercise) and would complicate the milestone tracker for little added value here.

---

## Decision: Coupon issuance — on-demand admin call vs. automatic issuance

**Context:** The assignment specifies two admin APIs: generate a discount code, and list store stats. It was ambiguous whether coupons are auto-issued by the system or minted on demand.

**Options Considered:**

- Option A: Auto-issue — the coupon is created automatically the moment the *n*th order completes.
- Option B: On-demand — the admin explicitly calls `POST /admin/coupons`, which checks whether a milestone is pending and only then mints a coupon.

**Choice:** Option B — coupons are generated on demand via the admin endpoint.

**Why:** The assignment explicitly lists "Generate a discount code" as an admin API, so the on-demand flow matches the required surface exactly. It also keeps the checkout path free of coupon-minting side effects and gives the store owner explicit control over when coupons are created.

---

## Decision: Invalid coupon at checkout — block the order vs. proceed without discount

**Context:** When a customer supplies a coupon code that is invalid or already used, the checkout needs a defined behavior.

**Options Considered:**

- Option A: Proceed without the discount and silently ignore the bad code.
- Option B: Reject the whole checkout with a `400` error so the customer can fix the code.

**Choice:** Option B — checkout fails if the coupon is invalid or already used.

**Why:** A discount code is a contract between the store and the customer; silently ignoring a bad code risks charging the wrong amount and hides bugs. Blocking is stricter, simpler to implement, and much easier to test. The trade-off (a customer must retry with a valid code) is acceptable for this exercise.

---

## Decision: Coupon lifecycle — single-use, no expiry

**Context:** A coupon could be redeemable multiple times, expire after a date, or be single-use forever.

**Options Considered:**

- Option A: Reusable coupons that never expire.
- Option B: Single-use coupons (a coupon can be applied to exactly one order), no expiry.

**Choice:** Option B — coupons transition `unused -> used` exactly once, enforced inside `redeem()`.

**Why:** Single-use matches how real promo codes typically behave and gives the store predictable discount exposure. The transition is enforced in one place (`CouponsService.redeem`), which keeps the invariant local and easy to unit test. No expiry was added because time-based logic is outside the scope of the exercise.

---

## Decision: Money representation — floating point vs. integer cents

**Context:** Pricing and discount math can suffer from floating-point rounding errors (e.g. `0.1 + 0.2`).

**Options Considered:**

- Option A: Store money as JS `number` floats (dollars).
- Option B: Store money as integer cents and centralize all arithmetic in a `Money` helper.

**Choice:** Option B — all money is integer cents, and every operation (add, subtract, sum, multiply, percent) goes through `Money`.

**Why:** Integer cents eliminate floating-point drift entirely. Centralizing the math in one module means rounding policy is decided in exactly one place, and the helpers are trivially unit-testable. The discount percentage is computed with `Math.floor`, which never over-discounts and always rounds in the store's favor.

---

## Decision: Configurability of the discount rule (n and x%)

**Context:** The nth-order and discount-percentage values could be hard-coded or configurable.

**Options Considered:**

- Option A: Hard-code `n = 5` and `x = 10`.
- Option B: Read them from env vars (`DISCOUNT_N`, `DISCOUNT_PERCENT`) and validate at boot.

**Choice:** Option B — values come from environment variables, validated at startup, with sensible defaults.

**Why:** Making the rule configurable lets the store tune the promotion without code changes and makes the discount system reusable. Validating at boot means a bad configuration fails fast with a clear error instead of producing wrong discount math at runtime. `n >= 1` and `0 < x < 100` are enforced; the upper bound on `x` prevents a `100%` discount silently making orders free.

---

## Decision: Coupons per milestone — one coupon, claimed sequentially

**Context:** Once the *n*th order is reached, how many coupons can the admin mint for that milestone, and what happens if the admin doesn't call `generate()` right away?

**Options Considered:**

- Option A: Mint unlimited coupons per milestone.
- Option B: Exactly one coupon per milestone, and `generate()` always claims the _next_ unclaimed milestone (never skips ahead).

**Choice:** Option B — one coupon per milestone, claimed in order via a single atomic `claimNextMilestone()` call.

**Why:** Unlimited coupons would let the admin dump infinite discounts. Sequential claiming means a milestone's coupon is never silently forfeited just because the admin was slow to call `generate()`; the system remembers that milestone 1 is still owed. Because check-and-claim happens in one method, the invariant holds by construction rather than by convention.

---

## Decision: Storage — database vs. in-memory repositories

**Context:** The assignment explicitly allows an in-memory store. We had to pick an architecture that would work now and stay sane later.

**Options Considered:**

- Option A: Add a real database (SQLite/Postgres) with ORM.
- Option B: In-memory repositories behind a repository interface.

**Choice:** Option B — lightweight in-memory repositories (`CartRepository`, `OrdersRepository`, `CouponsRepository`) injected via NestJS DI.

**Why:** The exercise explicitly permits in-memory storage, and a database would add setup overhead for no required functionality. Keeping repositories behind small interfaces means a real persistence layer could be swapped in later without touching the services. This also makes services trivially unit-testable with the same repository contracts.

---

## Decision: When to validate product existence and stock

**Context:** A cart can reference a product that doesn't exist or that has insufficient stock. This can be checked at `addItem` time or at checkout.

**Options Considered:**

- Option A: Defer all product validation to checkout.
- Option B: Validate product existence and stock at `addItem`/quantity-change time, and re-check stock at checkout.

**Choice:** Option B — products are validated at the data-entry boundary (`addItem`, `setItemQuantity`), and stock is re-asserted before the order commits.

**Why:** Enforcing invariants where data enters the system means a cart can never hold an unknown `productId` or a quantity beyond current stock, which keeps error messages timely and state consistent. Re-checking at checkout protects against stock being depleted between adding to cart and placing the order (an important correctness property that is unit-tested).

---

## Decision: Admin endpoint authentication

**Context:** The admin APIs (`generate coupon`, `stats`, `config`) are sensitive but the assignment didn't mention auth.

**Options Considered:**

- Option A: Implement full auth (JWT, API keys, roles).
- Option B: Ship without authentication for this exercise.

**Choice:** Option B — no authentication on admin endpoints.

**Why:** Authentication is explicitly out of scope for this exercise, and inventing a half-baked auth scheme would be worse than none. This is documented here so it reads as a conscious omission rather than a gap. In a real deployment, an auth layer (e.g. `@nestjs/jwt` guard on the `admin` routes) would be the first thing added.

---

## Decision: Checkout atomicity without a transaction

**Context:** A checkout touches multiple stores (coupon redemption, order save, stock decrement, cart clear, milestone record). Any partial failure would corrupt state.

**Options Considered:**

- Option A: Wrap the flow in a database transaction.
- Option B: Order the operations so all failure checks happen before any mutation, then commit in one synchronous block.

**Choice:** Option B — all validation (cart non-empty, product exists, stock available) happens first; only then are the state changes applied in a single uninterrupted function call.

**Why:** There is no database, so there is nothing to roll back. Because the whole flow is synchronous and single-threaded, performing every check before any mutation means the order either fully succeeds or leaves no trace. This is simpler than simulating transactions and is covered by a unit test that depletes stock after adding to cart and asserts nothing changes.
