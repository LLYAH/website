// POST /api/checkout — Stripe Checkout Session for a real cart.
// Body: { items:[{id,qty}], coupon?, email?, phone?, address?, notes? }
// Prices come from the server catalog; client totals are never trusted.

import Stripe from "stripe";
import { json, readJsonBody, siteOrigin, money } from "./_lib/util.js";
import { quote } from "./_lib/catalog.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return json(res, 503, { error: "Stripe is not configured yet." });

  const body = readJsonBody(req);
  const q = quote({ items: body.items, coupon: body.coupon, state: body.address && body.address.state });
  if (q.error) return json(res, 400, { error: q.error });
  const origin = siteOrigin(req);
  const useStripeTax = process.env.STRIPE_TAX === "1";

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const line_items = q.lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: "usd",
        unit_amount: l.unitCents,
        product_data: { name: l.name, description: l.category }
      }
    }));
    // Without Stripe Tax the 7% estimate shown in the UI is charged as its own line.
    if (!useStripeTax && q.taxCents > 0) {
      line_items.push({
        quantity: 1,
        price_data: { currency: "usd", unit_amount: q.taxCents, product_data: { name: "Estimated sales tax (7%)" } }
      });
    }

    let discounts;
    if (q.discountCents > 0 && q.coupon) {
      const coupon = await stripe.coupons.create({
        amount_off: q.discountCents, currency: "usd", duration: "once", name: q.coupon.label
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items,
      discounts,
      automatic_tax: useStripeTax ? { enabled: true } : undefined,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: q.shippingCents === 0 ? "Free shipping" : "Standard shipping",
          fixed_amount: { amount: q.shippingCents, currency: "usd" },
          delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 8 } }
        }
      }],
      phone_number_collection: { enabled: Boolean(body.phone) },
      metadata: {
        kind: "order",
        items: JSON.stringify(q.lines.map((l) => [l.id, l.qty])).slice(0, 480),
        coupon: q.coupon ? q.coupon.code : "",
        subtotal_cents: String(q.subtotalCents),
        discount_cents: String(q.discountCents),
        shipping_cents: String(q.shippingCents),
        tax_cents: String(q.taxCents),
        donation_cents: String(q.donationCents),
        notes: String(body.notes || "").slice(0, 400)
      },
      payment_intent_data: { description: "Order · Love & Love YAH " + money(q.totalCents) },
      success_url: origin + "/order-thanks?gateway=stripe&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/checkout?canceled=1"
    });
    return json(res, 200, { url: session.url, id: session.id, quote: q });
  } catch (e) {
    console.error("[checkout] stripe error:", e.message);
    return json(res, 502, { error: "We couldn't reach Stripe. Please try again." });
  }
}
