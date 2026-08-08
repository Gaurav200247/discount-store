# Frontend Plan — Ecommerce Discount System

Thin React client over the NestJS backend (Phases 0–6 of `IMPLEMENTATION_PLAN.md`). This is **Phase 7** — the stretch phase.

---

## 1. Goal & scope

A storefront + admin UI that consumes the verified backend APIs:

| Backend API | Used by |
|---|---|
| `GET /products` | Storefront product grid |
| `POST /cart/items`, `GET /cart/:id` | Cart |
| `POST /checkout` | Checkout (with coupon input) |
| `POST /admin/coupons` | Admin — generate coupon |
| `GET /admin/stats` | Admin — dashboard |

---

## 2. Tech stack

- **React 18 + Vite + TypeScript** — scaffolded via `create-vite`.
- **TailwindCSS v4** (`@tailwindcss/vite` plugin, CSS-first config).
- **shadcn/ui** — component library on top of Tailwind (Button, Card, Input, Badge, Skeleton, ...).
- **TanStack Query** — server state: products, stats, mutations with automatic invalidation.
- **React Router** — pages (`/`, `/cart`, `/checkout`, `/admin`).
- **lucide-react** — icons.
- **API client** — typed `fetch` wrapper; base URL from `VITE_API_URL` (default `http://localhost:3000`).
- **Backend CORS** — one-line `app.enableCors()` added in `main.ts` so the browser client can call it (no proxy complexity).

---

## 3. Design system — Dark + Lime theme

Target look: near-black background, **lime/green primary**, subtle gray surfaces.

| Token | Value (HSL) | Notes |
|---|---|---|
| `background` | `240 10% 3.9%` | zinc-950 near-black |
| `foreground` | `0 0% 98%` | near-white text |
| `card` / `popover` | `240 10% 3.9%` | same as bg |
| `primary` | `84 81% 44%` | lime-500 `#84cc16` |
| `primary-foreground` | `0 0% 0%` | near-black text on lime (classic contrast) |
| `muted` / `secondary` / `accent` | `240 3.7% 15.9%` | subtle gray surfaces |
| `border` / `input` | `240 3.7% 15.9%` | |
| `ring` | `84 81% 44%` | lime focus ring |
| `destructive` | `0 62.8% 30.6%` | for errors |

- **Dark only** for this project — `class="dark"` set on `<html>`, `color-scheme: dark`.
- Rounded theme: `radius = 0.5rem` (shadcn default).

---

## 4. Pages & routes

| Route | Page | Backend calls |
|---|---|---|
| `/` | Storefront — product grid | `GET /products` |
| `/cart` | Cart — line items, quantities, remove | `POST /cart/items`, `GET /cart/:id` |
| `/checkout` | Checkout — order summary + coupon code input | `POST /checkout` |
| `/admin` | Admin — stats cards + coupon generation | `GET /admin/stats`, `POST /admin/coupons` |

Shared layout: sticky header with brand + nav (Store, Cart with item count badge, Admin), container, footer.

---

## 5. State approach

- **Server state (TanStack Query):** products, stats, cart read — cached, refetched via query keys.
- **Mutations:** `addToCart`, `checkout`, `generateCoupon` — `onSuccess` invalidates `['cart']` / `['stats']`.
- **Cart id + items:** client-side source of truth in `localStorage` (`cartId`, items mirror). Backend is the authority at checkout; the UI keeps a light local cart for instant feel.
- **Feedback:** query/loading skeletons, error banners, mutation `isPending` button states, toasts on success/error.

---

## 6. Phases

### F0 — Scaffold + theme (this task)
- `create-vite` React-TS app, Tailwind v4, shadcn dark-lime theme.
- Base components: `Button`, `Card`, `Input`, `Badge`, `Skeleton`.
- App shell: header/nav, container, themed demo (buttons, cards, badges) to prove the theme.
- **Deliverable:** `npm run dev` shows a dark page with lime accents.
- **Test:** buttons render with lime primary, focus ring is lime, no Tailwind classes missing.

### F1 — API client + products page
- `lib/api.ts` typed fetch wrapper + `lib/queries.ts` TanStack Query hooks.
- `GET /products` → product grid cards (name, price in ₹/cents formatted, Add to cart button).
- Add `app.enableCors()` to backend `main.ts`.
- **Deliverable:** `/` lists real products from the backend.
- **Test:** grid renders 5 seeded products; backend down → error banner, not a crash.

### F2 — Cart
- Cart page + cart id persistence (localStorage), add/remove/update quantities.
- Sync with `POST /cart/items`; header badge shows item count.
- **Deliverable:** add products on storefront, see them in `/cart`.
- **Test:** add → badge updates; quantity increments; empty cart state.

### F3 — Checkout with coupon
- `/checkout`: line items + totals, coupon input, "Place order" → `POST /checkout`.
- Success screen with order total; invalid/used coupon → inline error (backend `400`).
- **Deliverable:** place an order with a coupon, see discounted total.
- **Test:** 10% coupon math matches backend; reused coupon shows error.

### F4 — Admin
- `/admin`: stats cards (items purchased, revenue, coupons, total discounts) via `GET /admin/stats`, auto-refresh.
- "Generate coupon" button → `POST /admin/coupons`; success shows code, `409` shows "no milestone pending" toast.
- **Deliverable:** full admin loop works end-to-end after 5 orders.
- **Test:** generate before 5 orders → 409 toast; after 5 orders → code shown.

### F5 — Polish
- Loading skeletons, empty states, toasts, responsive layout, small animations.
- **Deliverable:** submission-ready storefront + admin.
- **Test:** walk the full flow without console errors; mobile layout usable.

---

## 7. Out of scope (for now)
- Auth/login (admin UI is open — matches backend D16).
- Payment flow — checkout just places the order.
- TanStack Router — React Router is enough for 4 pages (can swap later if needed).
