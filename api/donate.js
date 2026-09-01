// POST /api/donate  { amount: 25, frequency: "onetime"|"monthly", email?, name? }
// Creates a Stripe Checkout Session server-side (dynamic amounts, monthly =
// subscription mode) and returns { url } for the browser to redirect to.

import Stripe from "stripe";
import { json, readJsonBody, parseAmount, parseFrequency, siteOrigin } from "./_lib/util.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return json(res, 503, { error: "Stripe is not configured yet." });

  const body = readJsonBody(req);
  const { cents, error } = parseAmount(body.amount);
  if (error) return json(res, 400, { error });
  const frequency = parseFrequency(body.frequency);
  const origin = siteOrigin(req);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const recurring = frequency === "monthly";
    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      submit_type: recurring ? undefined : "donate",
      customer_email: body.email || undefined,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: cents,
          product_data: {
            name: recurring ? "Monthly donation · Love & Love YAH" : "Donation · Love & Love YAH",
            description: "100% goes to our give-back partners."
          },
          ...(recurring ? { recurring: { interval: "month" } } : {})
        }
      }],
      metadata: { kind: "donation", frequency, amount_cents: String(cents) },
      ...(recurring
        ? { subscription_data: { metadata: { kind: "donation", frequency, amount_cents: String(cents) } } }
        : { payment_intent_data: { description: "Donation · Love & Love YAH", metadata: { kind: "donation", frequency } } }),
      success_url: origin + "/donate-thanks?gateway=stripe&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/donate?canceled=1"
    });
    return json(res, 200, { url: session.url, id: session.id });
  } catch (e) {
    console.error("[donate] stripe error:", e.message);
    return json(res, 502, { error: "We couldn't reach Stripe. Please try again." });
  }
}
