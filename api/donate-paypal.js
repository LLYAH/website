// POST /api/donate-paypal?action=create   { amount, frequency }  -> { url }
// POST /api/donate-paypal?action=capture  { token, subscription_id } -> { ok }
// One-time gifts use Orders v2; monthly gifts use Subscriptions v1.

import { json, readJsonBody, parseAmount, parseFrequency, siteOrigin } from "./_lib/util.js";
import { pp, approveLink, monthlyPlan, paypalConfigured } from "./_lib/paypal.js";
import { recordDonation, sendReceipt } from "./_lib/donations.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!paypalConfigured()) return json(res, 503, { error: "PayPal is not configured yet." });

  const action = (req.query && req.query.action) || "create";
  const body = readJsonBody(req);
  const origin = siteOrigin(req);

  try {
    if (action === "create") {
      const { cents, error } = parseAmount(body.amount);
      if (error) return json(res, 400, { error });
      const frequency = parseFrequency(body.frequency);
      const value = (cents / 100).toFixed(2);

      if (frequency === "monthly") {
        const planId = await monthlyPlan(cents);
        const sub = await pp("/v1/billing/subscriptions", {
          method: "POST",
          body: {
            plan_id: planId,
            custom_id: "donation:monthly:" + cents,
            subscriber: body.email ? { email_address: body.email } : undefined,
            application_context: {
              brand_name: "Love & Love YAH",
              user_action: "SUBSCRIBE_NOW",
              shipping_preference: "NO_SHIPPING",
              return_url: origin + "/donate-thanks?gateway=paypal&frequency=monthly",
              cancel_url: origin + "/donate?canceled=1"
            }
          }
        });
        return json(res, 200, { url: approveLink(sub), id: sub.id });
      }

      const order = await pp("/v2/checkout/orders", {
        method: "POST",
        body: {
          intent: "CAPTURE",
          payer: body.email ? { email_address: body.email } : undefined,
          purchase_units: [{
            amount: { currency_code: "USD", value },
            description: "Donation · Love & Love YAH",
            custom_id: "donation:onetime:" + cents
          }],
          application_context: {
            brand_name: "Love & Love YAH",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: origin + "/donate-thanks?gateway=paypal&frequency=onetime",
            cancel_url: origin + "/donate?canceled=1"
          }
        }
      });
      return json(res, 200, { url: approveLink(order), id: order.id });
    }

    if (action === "capture") {
      // Monthly: approval is enough, the subscription webhook confirms activation.
      if (body.subscription_id) {
        const sub = await pp("/v1/billing/subscriptions/" + encodeURIComponent(body.subscription_id));
        const cents = Math.round(Number(sub.billing_info?.last_payment?.amount?.value
          || sub.plan?.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value || 0) * 100);
        const donation = {
          gateway: "paypal", ref: "sub_" + sub.id, frequency: "monthly",
          amountCents: cents, currency: "usd",
          name: [sub.subscriber?.name?.given_name, sub.subscriber?.name?.surname].filter(Boolean).join(" "),
          email: sub.subscriber?.email_address, status: (sub.status || "").toLowerCase(), raw: sub
        };
        await recordDonation(donation);
        if (donation.status === "active") await sendReceipt(donation);
        return json(res, 200, { ok: true, status: sub.status, amount_cents: cents });
      }

      const token = body.token || body.order_id;
      if (!token) return json(res, 400, { error: "Missing PayPal order token." });
      const cap = await pp("/v2/checkout/orders/" + encodeURIComponent(token) + "/capture", { method: "POST" });
      const unit = cap.purchase_units?.[0];
      const payment = unit?.payments?.captures?.[0];
      const cents = Math.round(Number(payment?.amount?.value || 0) * 100);
      const donation = {
        gateway: "paypal", ref: payment?.id || cap.id, frequency: "onetime",
        amountCents: cents, currency: (payment?.amount?.currency_code || "usd").toLowerCase(),
        name: [cap.payer?.name?.given_name, cap.payer?.name?.surname].filter(Boolean).join(" "),
        email: cap.payer?.email_address, status: (cap.status || "completed").toLowerCase(), raw: cap
      };
      await recordDonation(donation);
      await sendReceipt(donation);
      return json(res, 200, { ok: true, status: cap.status, amount_cents: cents });
    }

    return json(res, 400, { error: "Unknown action." });
  } catch (e) {
    console.error("[donate-paypal]", action, e.message);
    // A double capture (browser refresh on the thank-you page) is not a failure.
    if (/ORDER_ALREADY_CAPTURED/i.test(e.message)) return json(res, 200, { ok: true, status: "COMPLETED" });
    return json(res, 502, { error: "PayPal couldn't complete this request." });
  }
}
