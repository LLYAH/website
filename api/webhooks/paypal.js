// POST /api/webhooks/paypal — completed/recurring PayPal donations.
// Subscribe in PayPal Developer → Webhooks to:
//   PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.ACTIVATED,
//   BILLING.SUBSCRIPTION.CANCELLED, PAYMENT.SALE.COMPLETED
// Set PAYPAL_WEBHOOK_ID to enable signature verification.

import { pp } from "../_lib/paypal.js";
import { recordDonation, sendReceipt } from "../_lib/donations.js";
import { recordOrder } from "../_lib/orders.js";

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
  const raw = (await rawBody(req)).toString("utf8");
  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).send("Bad JSON"); }

  if (process.env.PAYPAL_WEBHOOK_ID) {
    try {
      const v = await pp("/v1/notifications/verify-webhook-signature", {
        method: "POST",
        body: {
          auth_algo: req.headers["paypal-auth-algo"],
          cert_url: req.headers["paypal-cert-url"],
          transmission_id: req.headers["paypal-transmission-id"],
          transmission_sig: req.headers["paypal-transmission-sig"],
          transmission_time: req.headers["paypal-transmission-time"],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: event
        }
      });
      if (v.verification_status !== "SUCCESS") {
        console.error("[paypal webhook] verification failed");
        return res.status(400).send("Invalid signature");
      }
    } catch (e) {
      console.error("[paypal webhook] verify error:", e.message);
      return res.status(400).send("Verification error");
    }
  }

  const r = event.resource || {};
  try {
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" || event.event_type === "PAYMENT.SALE.COMPLETED") {
      const custom = String(r.custom_id || "");
      if (custom.startsWith("order:")) {
        await recordOrder({
          gateway: "paypal", ref: r.id,
          totalCents: Math.round(Number(r.amount?.value || 0) * 100),
          donationCents: Number(custom.split(":")[2] || 0),
          coupon: custom.split(":")[1] === "none" ? null : custom.split(":")[1],
          status: "paid", raw: { event: event.id }
        });
      } else {
        const donation = {
          gateway: "paypal", ref: r.id,
          frequency: r.billing_agreement_id ? "monthly" : "onetime",
          amountCents: Math.round(Number(r.amount?.value || r.amount?.total || 0) * 100),
          currency: (r.amount?.currency_code || r.amount?.currency || "usd").toLowerCase(),
          email: r.payer?.email_address, status: "completed", raw: { event: event.id }
        };
        await recordDonation(donation);
      }
    } else if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const cents = Math.round(Number(r.billing_info?.last_payment?.amount?.value || 0) * 100);
      const donation = {
        gateway: "paypal", ref: "sub_" + r.id, frequency: "monthly",
        amountCents: cents, currency: "usd",
        name: [r.subscriber?.name?.given_name, r.subscriber?.name?.surname].filter(Boolean).join(" "),
        email: r.subscriber?.email_address, status: "active", raw: { event: event.id }
      };
      await recordDonation(donation);
      await sendReceipt(donation);
    } else if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      await recordDonation({
        gateway: "paypal", ref: "sub_" + r.id, frequency: "monthly",
        amountCents: 0, status: "canceled", raw: { event: event.id }
      });
    }
  } catch (e) {
    console.error("[paypal webhook] handler failed:", e.message);
    return res.status(500).send("Handler error"); // PayPal retries
  }
  return res.status(200).json({ received: true });
}
