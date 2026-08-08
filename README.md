# Ecommerce Discount System

A small ecommerce store with a reward-based discount system. Customers add items to a cart and check out; every *n*th order (a "milestone order") automatically earns a coupon code worth `x%` off. A coupon is single-use and can be applied to any order.

- **Backend:** NestJS (TypeScript), in-memory storage, unit-tested business logic
- **Frontend:** React + Vite + Tailwind (bonus)
- **Money:** all amounts are integer cents to avoid floating-point errors

## Getting Started

Prerequisites: Node.js 20+ and npm.

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

The API listens on `http://localhost:3000` by default.

- Interactive Swagger docs: <http://localhost:3000/api>
- OpenAPI JSON: <http://localhost:3000/api-json>

#### Environment variables (optional)

| Variable           | Default | Description                        |
| ------------------ | ------- | ---------------------------------- |
| `PORT`             | `3000`  | HTTP port                          |
| `DISCOUNT_N`       | `5`     | Every nth order earns a coupon     |
| `DISCOUNT_PERCENT` | `10`    | Coupon discount percentage (0–100) |

Example:

```bash
PORT=4000 DISCOUNT_N=3 DISCOUNT_PERCENT=15 npm run start:dev
```

Invalid values (non-integers, `n < 1`, `x` outside 0–100) make the app refuse to start.

#### Running the tests

```bash
cd backend
npm test        # unit tests (Jest)
npm run lint    # type-check (tsc --noEmit)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The frontend expects the backend on `http://localhost:3000`.

## API Overview

All money fields are in integer cents.

| Method | Route                        | Description                                  |
| ------ | ---------------------------- | -------------------------------------------- |
| POST   | `/products`                  | Create a product                             |
| GET    | `/products`                  | List products                                |
| PATCH  | `/products/:id`              | Update a product                             |
| POST   | `/cart/items`                | Add an item to a cart                        |
| GET    | `/cart/:id`                  | Get a cart                                   |
| PATCH  | `/cart/:id/items/:productId` | Set an item quantity                         |
| DELETE | `/cart/:id/items/:productId` | Remove an item                               |
| DELETE | `/cart/:id`                  | Clear a cart                                 |
| POST   | `/checkout`                  | Place an order (optionally with a coupon)    |
| GET    | `/orders`                    | List orders                                  |
| GET    | `/admin/stats`               | Items purchased, revenue, coupons, milestones |
| GET    | `/admin/config`              | Current discount rule (`n`, `percent`)       |
| PATCH  | `/admin/config`              | Update the discount rule at runtime          |

### Discount flow (quick demo)

Coupons are generated **automatically**: every *n*th order (milestone order) mints a coupon. A coupon is single-use and can be applied to **any** order.

1. Add a product to a cart:
   ```bash
   curl -X POST localhost:3000/cart/items \
     -H "Content-Type: application/json" \
     -d '{"productId":"mouse","quantity":2}'
   ```
   Copy the returned `id` as your `cartId`.
2. Place `DISCOUNT_N` orders (default 5). The milestone order's response includes an `earnedCoupon` — e.g. `"earnedCoupon":{"code":"NODLXD92","discountPercent":10,"status":"unused",...}`.
3. On any later order, check out with the coupon:
   ```bash
   curl -X POST localhost:3000/checkout \
     -H "Content-Type: application/json" \
     -d '{"cartId":"<your-cart-id>","couponCode":"NODLXD92"}'
   ```
   The coupon is marked `used` and cannot be applied again.
4. View the store stats (including milestones reached):
   ```bash
   curl localhost:3000/admin/stats
   ```

## Project Layout

```
backend/          NestJS API
  src/cart/       cart service + repository
  src/products/   product catalog + stock
  src/orders/     checkout flow
  src/coupons/    coupon generation + redemption + milestone tracker
  src/config/     discount rule (n, percent)
  src/stats/      admin statistics
  src/common/     money helper, exceptions, filters, middleware
frontend/         React storefront + admin UI
docs/             design notes, implementation plan, user stories
```

## Documentation

- `DECISIONS.md` — design decisions with rationale
- `docs/DESIGN.md` — architecture and locked decisions
- `docs/IMPLEMENTATION_PLAN.md` — phased build plan
- `docs/FE_PLAN.md` — frontend plan
- `docs/USER_STORIES.md` — user stories
