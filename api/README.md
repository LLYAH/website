# Payments backend

Live endpoints behind the Donate and Checkout pages. Deploys as Vercel Functions from this folder — no framework port required.

| Route | Purpose |
| --- | --- |
| `POST /api/donate` | Creates a Stripe Checkout Session. `payment` mode for one-time, `subscription` mode for monthly. Returns `{ url }`. |
| `POST /api/donate-paypal?action=create` | PayPal Orders v2 order (one-time) or Subscriptions v1 subscription (monthly). Returns `{ url }` (the approve link). |
| `POST /api/donate-paypal?action=capture` | Captures the approved PayPal order / confirms the subscription. Called by `donate-thanks.html` on return. |
| `POST /api/checkout` | Stripe Checkout Session for a cart. Client sends item ids + quantities; prices, coupon, shipping and tax come from `_lib/catalog.js`. |
| `POST /api/checkout-paypal?action=create` | PayPal Orders v2 order with a full item breakdown. Returns `{ url }`. |
| `POST /api/checkout-paypal?action=capture` | Captures the approved order, writes it to the ledger, emails the confirmation. Called by `order-thanks.html`. |
| `POST /api/webhooks/stripe` | Signature-verified source of truth: `checkout.session.completed` (orders **and** donations), `invoice.paid`, `customer.subscription.deleted`. |
| `POST /api/webhooks/paypal` | `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.SALE.COMPLETED`, `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`. |

Amounts are validated and priced server-side (`$1`–`$100,000`); the client only sends a requested amount and frequency. Ledger writes are idempotent on the gateway reference, so retried webhook deliveries never double-count.

## Setup

1. Copy `.env.example` values into Vercel → Project → Environment Variables.
2. Stripe Dashboard → Webhooks → add `https://YOURDOMAIN/api/webhooks/stripe`, subscribe to the three events above, paste the signing secret as `STRIPE_WEBHOOK_SECRET`.
3. PayPal Developer → Apps & Credentials → REST app → client id/secret. Webhooks → add `https://YOURDOMAIN/api/webhooks/paypal`, subscribe to the four events, paste the webhook id as `PAYPAL_WEBHOOK_ID`. Set `PAYPAL_ENV=sandbox` while testing.
4. Optional: `POSTGRES_URL` (from the Supabase Marketplace integration — `vercel integration add supabase`) creates and writes the `orders`/`donations` tables automatically. Without it, every order/donation is written to the function logs instead.
5. Optional: `RESEND_API_KEY` + `RECEIPT_FROM` send donor receipts; `DONATION_NOTIFY_TO` copies your team.

## Notes

- Monthly PayPal gifts need a billing plan per amount. `_lib/paypal.js` creates the giving product and per-amount plans on demand with deterministic request ids, so repeat amounts reuse the same plan. Set `PAYPAL_PRODUCT_ID` to pin an existing catalog product.
- Checkout is a redirect flow, which is the correct pattern for arbitrary cart totals: Payment Links can't price a dynamic cart, and a self-hosted card form would put you in PCI scope. Stripe Checkout and PayPal both host the card fields.
- `_lib/catalog.js` prices two kinds of id: fixed goods from the demo `CATALOG` (wood-*, glass-*) and apparel variants `<prefix>-<size>-<color>-<price>` built by the product pages. The trailing price must match one of that product's published tiers or the line is refused, so the id alone decides what is charged. Ids saved before this change (no trailing tier) price at the base tier. It is the one place to swap for real product/coupon tables — every price the customer is charged is read from it.
- Sales tax is a flat 7% line item until you set `STRIPE_TAX=1` (then Stripe Tax computes it and the line is dropped). Ship the real thing before launch.
- Each order records `donation_cents` (10% of the discounted subtotal) for give-back reporting.
- Tax-deductible receipt copy is on the donate page. If you need formal acknowledgment letters (donor name + address), collect them in Stripe Checkout (`billing_address_collection: "required"`) and PayPal, and extend the receipt template.
