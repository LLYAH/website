// POST /api/webhooks/stripe — source of truth for completed Stripe donations.
// Add the endpoint in Stripe Dashboard → Webhooks with these events:
//   checkout.session.completed, invoice.paid, customer.subscription.deleted

import Stripe from "stripe";
import { recordDonation, sendReceipt } from "../_lib/donations.js";
import { recordOrder, sendOrderEmail } from "../_lib/orders.js";

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !secret) return res.status(503).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  let event;
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], secret);
  } catch (e) {
    console.error("[stripe webhook] bad signature:", e.message);
    return res.status(400).send("Invalid signature");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      if (s.metadata?.kind === "order") {
        const m = s.metadata || {};
        const ship = s.shipping_details?.address || s.customer_details?.address || {};
        const order = {
          gateway: "stripe", ref: s.payment_intent || s.id,
          email: s.customer_details?.email, name: s.shipping_details?.name || s.customer_details?.name,
          items: JSON.parse(m.items || "[]").map(([id, qty]) => ({ name: id, qty, totalCents: 0 })),
          subtotalCents: Number(m.subtotal_cents || 0),
          discountCents: Number(m.discount_cents || 0),
          shippingCents: Number(m.shipping_cents || 0),
          taxCents: Number(m.tax_cents || 0),
          totalCents: s.amount_total,
          donationCents: Number(m.donation_cents || 0),
          coupon: m.coupon || null,
          address: {
            line1: ship.line1, line2: ship.line2, city: ship.city,
            state: ship.state, postal: ship.postal_code, country: ship.country
          },
          notes: m.notes || null, status: "paid", raw: { session: s.id }
        };
        await recordOrder(order);
        await sendOrderEmail(order);
      } else if (s.metadata?.kind === "donation" && s.mode === "payment") {
        const donation = {
          gateway: "stripe", ref: s.payment_intent || s.id, frequency: "onetime",
          amountCents: s.amount_total, currency: s.currency,
          name: s.customer_details?.name, email: s.customer_details?.email,
          status: "completed", raw: { session: s.id }
        };
        await recordDonation(donation);
        await sendReceipt(donation);
      }
    } else if (event.type === "invoice.paid") {
      const inv = event.data.object;
      if (inv.subscription && inv.amount_paid > 0) {
        const donation = {
          gateway: "stripe", ref: inv.id, frequency: "monthly",
          amountCents: inv.amount_paid, currency: inv.currency,
          name: inv.customer_name, email: inv.customer_email,
          status: "completed", raw: { subscription: inv.subscription }
        };
        await recordDonation(donation);
        if (inv.billing_reason === "subscription_create") await sendReceipt(donation);
      }
    } else if (event.type === "customer.subscription.deleted") {
      console.log("[stripe] monthly donation canceled:", event.data.object.id);
    }
  } catch (e) {
    console.error("[stripe webhook] handler failed:", e.message);
    return res.status(500).send("Handler error"); // Stripe retries
  }
  return res.status(200).json({ received: true });
}
