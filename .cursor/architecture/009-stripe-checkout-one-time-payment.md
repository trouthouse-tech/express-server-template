# 009 – Stripe Checkout one-time payment

## Status

Accepted

## Context

Product apps sell one-time packs (credits, seats, downloads) through Stripe. Card data must stay on Stripe. Credits (or other entitlements) must be granted only after Stripe reports a paid Checkout Session. The success URL is not enough: a customer can pay and never land on it.

## Decision

### 1) Hosted Checkout, `mode: "payment"`

Create a Checkout Session with `mode: "payment"` and a Dashboard (or API) Price id from env. Do not send `price_data` from the client. Default `ui_mode` is hosted Checkout.

Catalog constants (sku, unit amount, credits) live in `src/services/{feature}/config.ts`. HTTP DTOs live in `src/services/{feature}/types.ts`, not `src/model`.

### 2) Layout

```text
src/services/managed/initialize-stripe-client.ts
src/services/stripe/
  router.ts                         # POST /  (mounted at /api/stripe/webhook)
  routes/stripe-webhook-handler.ts
  process-handle-stripe-webhook.ts
  process-fulfill-checkout-session.ts
src/services/{feature}/             # product grant + checkout create/complete
src/data/{purchase-table}/          # CRUD + optional grant RPC
src/data/stripe-event/              # insert event id after successful fulfill
src/model/{purchase-entity}.ts
src/model/stripe-event.ts
```

`new Stripe()` only in `initializeStripeClient()`. Handlers use `getManagedStripeClient()`. Null client → HTTP 500.

### 3) Raw-body webhook mount

Mount `express.raw({ type: "application/json" })` on `/api/stripe/webhook` **before** `setupEarlyMiddleware` / `express.json()`. Signature verification needs the unmodified body.

Auth for the webhook is `Stripe-Signature` plus `STRIPE_WEBHOOK_SECRET` only. Invalid signature or unreadable body → **400**. Unknown event types → **200** `{ success: true }`. Status codes stay 200 / 400 / 500 ([006](./006-logging-and-error-response-standards.md)).

### 4) Fulfill once

`processFulfillCheckoutSession(sessionId)` is the only grant path. The webhook and the authenticated complete endpoint both call it.

1. Retrieve the session from Stripe with `line_items` expanded. Do not grant from the webhook payload copy.
2. Require `mode === "payment"` and `payment_status === "paid"`. `unpaid` and `no_payment_required` grant nothing. Delayed methods wait for `checkout.session.async_payment_succeeded`.
3. Load the pending purchase by `metadata.purchase_id` (fallback: `stripe_checkout_session_id`). Require `metadata.app`, `user_id`, `sku`, Price id, and `amount_subtotal` (not `amount_total`, which can include tax) to match the row and feature config. Grant units from the **row**, not from metadata. `success_url` must use the browser Origin when it is the configured `WEB_ORIGIN` or the localhost / 127.0.0.1 twin so the return host keeps the same auth cookies.
4. Call a data-layer grant that is safe under concurrency (unique session id and/or status `pending` → `paid`).
5. Persist `users.stripe_customer_id` when empty.
6. Insert `stripe_event.id` after a successful fulfill. A throw returns 500 so Stripe retries. A retry after success is a no-op because the purchase is already `paid`.

Listen for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed` (mark failed, do not grant).

After session create succeeds, write `stripe_checkout_session_id` on the pending row immediately.

### 5) Metadata contract

| Key | Meaning |
|-----|---------|
| `app` | Which product ledger to credit |
| `user_id` | Auth user id |
| `sku` | Catalog key |
| `credits` | Informational; grant from the purchase row |
| `purchase_id` | Pending row id (`client_reference_id` is the same) |

`process-fulfill-checkout-session` switches on `metadata.app` and calls that product’s grant. The next app adds a grant function, not a second webhook.

### 6) Two-table grant RPC

A Postgres function that marks the purchase paid **and** increments a balance table is the allowed exception to “one table per folder” ([003](./003-data-layer-crud-boundaries.md)). The unique lock is the purchase row. Call it from `src/data/{purchase-table}/`. Price matching, metadata checks, and Stripe HTTP stay in `processX()`.

### 7) Complete endpoint

Authenticated `POST` with `{ sessionId }`. If `metadata.user_id` is not the caller, return 400. If still unpaid, return 400 (webhook grants later). On paid, return the product account summary.

## Related

- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md)
- [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md)
- [004 – Managed clients & startup init](./004-managed-clients-and-startup-init.md)
- [006 – Logging & error response standards](./006-logging-and-error-response-standards.md)
