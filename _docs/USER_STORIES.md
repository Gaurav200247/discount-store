# User Stories & Design Decisions

## Actors

- **Customer** — adds items to cart, checks out, applies discount codes.
- **Store Owner (Admin)** — generates discount codes when eligible, views store stats.
- **System** — tracks orders, evaluates the nth-order rule, validates and redeems coupons.

---

## Customer stories

### S1 — Add to cart

As a customer, I want to add products to my cart so I can buy them later.

- Start a cart, add an item (product + quantity), and get the current cart contents.
- Adding the same product again increments its quantity.

### S2 — Checkout without discount

As a customer, I want to check out my cart so I can place an order.

- System validates the cart is not empty, creates the order, records the full-amount sale.

### S3 — Checkout with valid discount code

As a customer, I want to enter my coupon code at checkout so I get x% off.

- System validates the code **exists and is unused** (coupons have no expiry — see D4).
- Applies the discount to the subtotal → order total is reduced.

**Acceptance criteria:**

- After a successful checkout using a code, that code's status becomes `used` (see S10).

### S4 — Rejected invalid code

As a customer, I want an invalid or already-used code rejected so I don't get a discount I'm not entitled to.

- Checkout with a bad or used code → clean validation error → order is **blocked** (see D3).

### S5 — Empty cart checkout

As a customer, I want to be prevented from ordering nothing.

- Checkout with an empty cart → 4xx error.

---

## System / business rules

### S6 — Track order milestones

As the system, I want to count every order placed so the nth-order rule can be evaluated.

- Every successful checkout increments a **global** order counter (see D1).

### S7 — Condition satisfied after nth order

As the system, I want to flag when a milestone (order #n, #2n, #3n...) is reached so a coupon becomes available.

---

## Admin stories

### S8 — Generate coupon when eligible

As the store owner, I want to generate a discount code only when the nth-order condition has been met.

- Admin calls "generate code" → system checks if a new milestone has occurred **since the last generated code**.
- If yes → issue one code (one coupon per milestone, see D7).
- If no → return a meaningful response: `409 Conflict` with a message (e.g. `no milestone pending`) — **not** an empty 200 (see D7).

### S9 — Stats dashboard

As the store owner, I want a stats view: items purchased, revenue, discount codes, and total discounts given.

- **Items purchased** = total **unit count** — the sum of all line-item quantities across all orders (see D9). Requires orders to store line items with quantities.
- **Revenue** = sum of all order totals.
- **Discount codes** = all generated codes with their current status.
- **Total discounts given** = sum of all discount amounts applied across orders.

### S10 — Coupon lifecycle

As the store owner, I want a coupon to become unusable once redeemed, so it can't be applied twice.

- A coupon's status transitions `unused → used` when a checkout successfully applies it (see S3 acceptance criteria).
- `used` codes are rejected at checkout (S4) and listed with status `used` in stats (S9).

---

## Decisions

| #   | Decision                                                                   | Choice                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | nth order counted **globally** vs per-customer                             | **Global** — matches "every nth order"; counter increments on every successful checkout (S6)                                                                                                                       |
| D2  | Coupon generated **on-demand** by admin vs auto-issued                     | **On-demand** — matches assignment wording "generate if the condition is satisfied" (S8)                                                                                                                           |
| D3  | Invalid code at checkout → **block the order** vs proceed without discount | **Block the order** — stricter, simpler, easier to test (S4)                                                                                                                                                       |
| D4  | Coupon **single-use**, no expiry                                           | **Single-use, no expiry** — keeps S3/S4 consistent; no "unexpired" checks                                                                                                                                          |
| D5  | `n` and `x%` configurable                                                  | **Yes** — via config/env (e.g. every 5th order, 10%)                                                                                                                                                               |
| D6  | Money representation                                                       | **Integer cents** — no floats anywhere; avoids precision bugs                                                                                                                                                      |
| D7  | Coupon issuance per milestone                                              | **One coupon per milestone** — generating twice between milestones returns `409` with a message, never silently no-ops (S8)                                                                                        |
| D8  | Concurrency assumption                                                     | **In-memory + synchronous/single-threaded** — no concurrent requests assumed. Double-spend of a coupon is impossible under this assumption; noted explicitly here to show the edge case was considered, not missed |
| D9  | "Items purchased" definition                                               | **Total unit count** = sum of all line-item quantities (S9); orders store line items with `quantity` per product                                                                                                   |
| D10 | Coupon status model                                                        | `unused → used` transition enforced on successful redemption (S10)                                                                                                                                                 |

### Open questions (resolve before implementation)

- None — all decisions pinned above. `n`, `x%`, and any seed products remain configuration values.
