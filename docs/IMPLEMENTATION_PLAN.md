# Implementation Plan

Phase-wise plan based on `DESIGN.md`. Every phase ends with a **working deliverable** and a clear **"what to test"** list.

**Running example used throughout:** `n = 5` (every 5th order earns a coupon), `x = 10` (10% discount).

---

## Phase 0 — Project skeleton + Money + Config

**Goal:** A NestJS app that boots, reads validated config, and has the money helper ready.

### What we implement
- Scaffold NestJS project (TypeScript, Jest wired up).
- `config/` module:
  - `discount.config.ts` reads `DISCOUNT_N` and `DISCOUNT_PERCENT` from env.
  - Validates at boot: `n >= 1`, `0 < x < 100` (D5). Bad config → app refuses to start with a clear error.
- `common/money.ts`: `add`, `subtract`, `sum`, `percentOf` — all integer cents, `percentOf` floors (D14).
- Global `ValidationPipe` + `HttpExceptionFilter` registered in `main.ts`.

### Deliverable
- `npm run start` boots with no errors.
- `npm test` runs (a couple of Money + config tests pass).

### What to test
- Money: `Money.percentOf(1000, 10)` → `100`. `Money.percentOf(555, 10)` → `55` (floored, not 56).
- Config bounds: start with `DISCOUNT_N=0` → refuses to boot. Also try `DISCOUNT_PERCENT=0` and `DISCOUNT_PERCENT=100` → both refuse to boot. This closes the loop with D14: floor-rounding only guarantees the discount "never exceeds x%" because x% itself is validated to `0 < x < 100`.

### Left for next phase
- No business logic yet — just plumbing.

---

## Phase 1 — Products catalog

**Goal:** A seeded product list you can fetch.

### What we implement
- `products/` module:
  - `Product` entity, seeded in-memory with 4–6 sample products (e.g. Phone `$499.99` = `49999` cents).
  - `GET /products` returns the list.
- `ProductNotFoundException` in `common/exceptions/`.

### Deliverable
- `GET /products` returns seeded catalog with prices in cents.

### What to test
- `GET /products` returns 200 with all seed products.
- Each price is an integer in cents.

### Left for next phase
- Cart can't add anything yet.

---

## Phase 2 — Cart (add / view)

**Goal:** A customer can add products to a cart.

### What we implement
- `cart/` module:
  - `CartRepository` — in-memory `Map<cartId, Cart>`, with `findOrCreate`, `save`, `clear`.
  - `CartService.addItem(cartId?, productId, quantity)`:
    - No `cartId` → creates a cart with `randomUUID()` (D15).
    - Checks the product exists → `404` otherwise (D13).
    - Same product added again → quantity increments (S1).
  - Endpoints: `POST /cart/items`, `GET /cart/:id`.
- `add-item.dto.ts` gets class-validator decorators — `@IsString() @IsOptional()` on `cartId`, `@IsString() @IsNotEmpty()` on `productId`, `@IsInt() @Min(1)` on `quantity`. These are what make the "quantity 0/negative → 400" test pass via the global `ValidationPipe` from Phase 0.

### Deliverable
- You can add items and see the cart: `POST /cart/items` → returns cart with `id`.

### What to test
- Add two different products → cart has 2 line items.
- Add same product twice → quantity becomes 2, not 2 line items.
- Add unknown product → `404 ProductNotFoundException`.
- Add with quantity 0 or negative → validation `400`.
- `GET /cart/:id` returns the same cart.

### Left for next phase
- No checkout, no coupons yet.

---

## Phase 3 — Coupon engine + admin generate

**Goal:** The nth-order rule can be tracked, and the admin can generate coupons.

### What we implement
- `coupons/` module:
  - `MilestoneTrackerService`:
    - `recordOrder()` bumps the global order counter (S6).
    - `claimNextMilestone(): number | null` — atomic sequential claim (D12).
  - `CouponsRepository` — in-memory code → coupon, with collision check on save.
  - `CouponsService`:
    - `generate()` — claims one milestone; none pending → `409 NoMilestonePendingException` (S8/D7).
    - `redeem(code)` — validates exists + `unused`, marks `used`, returns coupon (S10). Invalid/used → `InvalidCouponException`.
  - `Coupon.code` — 8-char base36 from `crypto.randomBytes` (D15).
  - Endpoint: `POST /admin/coupons`.
- `NoMilestonePendingException` + `InvalidCouponException` in `common/exceptions/`.

### Deliverable
- Admin can call `POST /admin/coupons` and get a code back — **only** when a milestone is pending.
- Note: milestones only advance once checkout exists (Phase 4), so we test the tracker directly here.

### What to test (tracker logic — this is the tricky part)
- `recordOrder()` x5 → `claimNextMilestone()` returns `1` (order #5 = milestone 1).
- Call again immediately → returns `null` (no double coupon).
- `recordOrder()` x5 more (total 10) → next claim returns `2`, not `1` or `3` (sequential, D12).
- **Backlog scenario:** record 10 orders at once → first claim returns `1`, second returns `2`, third returns `null`. No milestone skipped.
- `generate()` with no pending milestone → `409`.

### Left for next phase
- Coupons exist but can't be used yet — no checkout.

---

## Phase 4 — Checkout (the critical path)

**Goal:** A customer can place an order and apply a coupon.

### What we implement
- `orders/` module:
  - `OrdersRepository` — in-memory order log.
  - `OrdersService.checkout(dto)` — orchestrates the exact 7-step sequence from DESIGN §3:
    1. cart must exist + be non-empty → else `400 EmptyCartException` (S5)
    2. price line items, compute `subtotalCents`
    3. optional coupon → `redeem()` (block order if invalid, D3), compute `discountCents`
    4. build + save `Order` (snapshot line items, subtotal, discount, total, couponCode)
    5. `milestoneTracker.recordOrder()` — only after order saved
    6. `cartRepository.clear()`
    7. return order
  - Endpoint: `POST /checkout` with `{ cartId, couponCode? }`.

### Deliverable
- **Full happy path works:** add to cart → checkout → order created, cart cleared, order counter advanced.

### What to test (the money math)
- 2 × Phone (49999) subtotal = 99998. No coupon → total 99998.
- Same cart + coupon 10% → discount 9999 (floored), total 89999.
- Coupon code used once → second checkout with same code → `400 InvalidCouponException`, order NOT created.
- Empty cart checkout → `400`, and **order counter unchanged**.
- Invalid coupon → `400`, order NOT created, **coupon NOT burned** (validation happens before marking used).
- **D11 burn-risk test (the one that actually proves it):** a *valid* coupon that gets marked `used`, then the checkout fails for an unrelated reason afterward. Concretely: in a unit test, stub `OrdersRepository.save` to throw → `checkout` throws → assert (a) the coupon is already `used` (burned with no order — D11's accepted risk, now demonstrated, not just asserted), and (b) the order counter did **not** advance (because `recordOrder()` runs after save). This also verifies the step 4 → step 5 ordering under failure.
- After the 5th successful order, a fresh `POST /admin/coupons` returns a code (milestone wiring works end-to-end).

### Left for next phase
- No stats yet.

---

## Phase 5 — Stats (admin dashboard API)

**Goal:** Admin can see how the store is doing.

### What we implement
- `stats/` module:
  - `StatsService.getStats()`:
    - `itemsPurchased` — plain sum of all line-item quantities (D9, NOT Money).
    - `revenueCents` — `Money.sum` of all `order.totalCents`.
    - `coupons` — all generated codes + status.
    - `totalDiscountCents` — `Money.sum` of all `order.discountCents`.
  - Endpoint: `GET /admin/stats`.
- `OrdersModule` + `CouponsModule` export their repositories so stats can read (per DESIGN §7).

### Deliverable
- `GET /admin/stats` returns a full picture after a few orders.

### What to test (with a concrete scenario)
- Place order #1: 2 × Phone (99998 total, no coupon), order #2: 1 × Phone + 10% coupon.
- Expect:
  - `itemsPurchased` = 3
  - `revenueCents` = 99998 + (49999 − 4999) = 144998
  - `totalDiscountCents` = 4999
  - `coupons` contains the generated code with status `used`.

### Left for next phase
- No docs/README, no frontend.

---

## Phase 6 — Docs + polish + submission prep

**Goal:** The repo is submission-ready.

### What we implement
- `README.md` — setup (`npm install`, `npm run start:dev`), env vars, full API list with curl/Postman examples, seed products, and the `n=5 / x=10` walkthrough.
- `DECISIONS.md` — the 5+ required design decisions in the assignment's exact template, pulled from DESIGN §2 (pick the strongest: D6 Money, D12 sequential claim, D13 validation timing, D14 rounding, D3 block-on-invalid).
- `USER_STORIES.md` + `DESIGN.md` already live at repo root — keep as documentation.
- Optional (if time): Swagger UI, Postman collection.
- Final pass: `npm run lint`, `npm test`, then clean, meaningful git commits (the commit history is a deliverable — it must show *progression*, not just a finished state):
  - **Phases 0–2:** one commit per phase (skeleton, products, cart).
  - **Phase 3:** split into 2–3 commits — e.g. (a) `milestone-tracker` (the tricky claim logic, tested), (b) coupon repository + entity + code generation, (c) `coupons.service` + `POST /admin/coupons` controller.
  - **Phase 4:** split into 2–3 commits — e.g. (a) order entity + repository + empty-cart guard, (b) checkout orchestration with coupon redemption + discount math, (c) milestone wiring + cart clear + the D11 burn-risk test.
  - **Phases 5–6:** one commit each (stats, docs/polish).

### Deliverable
- A repo where a reviewer can: clone → `npm install` → `npm run start:dev` → run the full flow (add → checkout → admin generate → stats) in under 2 minutes.

### What to test (end-to-end script, the "demo")
1. `GET /products` → pick a product.
2. `POST /cart/items` → note cart id.
3. `POST /checkout` (no code) → order #1.
4. Repeat until 5 orders placed.
5. `POST /admin/coupons` → get code.
6. New cart → `POST /checkout` with the code → discount applied.
7. `POST /checkout` again with same code → `400`.
8. `GET /admin/stats` → numbers all match what you placed.

### Left (explicitly out of scope, documented)
- Frontend (React/shadcn/tanstack) — planned as a **Phase 7 stretch**, only if time allows.
- Auth on admin endpoints (D16) and idempotency keys — documented as conscious omissions.
- Persistence — in-memory storage per D8; no database layer.

---

## Summary table

| Phase | Builds | Delivers | Key test |
|---|---|---|---|
| 0 | skeleton + Money + config | bootable app | `percentOf(555,10)=55` |
| 1 | products | `GET /products` | catalog returns |
| 2 | cart | add/view cart | increment qty, unknown product 404 |
| 3 | coupon engine | `POST /admin/coupons` | sequential claim, backlog, 409 |
| 4 | checkout | `POST /checkout` | discount math, coupon burns once |
| 5 | stats | `GET /admin/stats` | totals match scenario |
| 6 | docs + polish | submission-ready repo | end-to-end demo script |
