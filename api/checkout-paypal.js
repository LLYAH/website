// POST /api/checkout-paypal?action=create   { items, coupon?, email?, address?, notes? } -> { url }
// POST /api/checkout-paypal?action=capture  { token } -> { ok, order }
// PayPal Orders v2 with a full server-priced item breakdown.

import { json, readJsonBody, siteOrigin } from "./_lib/util.js";
import { pp, approveLink, paypalConfigured } from "./_lib/paypal.js";
import { quote } from "./_lib/catalog.js";
import { recordOrder, sendOrderEmail } from "./_lib/orders.js";

const usd = (cents) => ({ currency_code: "USD", value: (cents / 100).toFixed(2) });

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!paypalConfigured()) return json(res, 503, { error: "PayPal is not configured yet." });

  const action = (req.query && req.query.action) || "create";
  const body = readJsonBody(req);
  const origin = siteOrigin(req);

  try {
    if (action === "create") {
      const q = quote({ items: body.items, coupon: body.coupon, state: body.address && body.address.state });
      if (q.error) return json(res, 400, { error: q.error });

      const order = await pp("/v2/checkout/orders", {
        method: "POST",
        body: {
          intent: "CAPTURE",
          purchase_units: [{
            custom_id: "order:" + (q.coupon ? q.coupon.code : "none") + ":" + q.donationCents,
            description: "Love & Love YAH order",
            items: q.lines.map((l) => ({
              name: l.name.slice(0, 127),
              quantity: String(l.qty),
              unit_amount: usd(l.unitCents),
              category: "PHYSICAL_GOODS"
            })),
            amount: {
              ...usd(q.totalCents),
              breakdown: {
                item_total: usd(q.subtotalCents),
                shipping: usd(q.shippingCents),
                tax_total: usd(q.taxCents),
                discount: usd(q.discountCents)
              }
            }
          }],
          payer: body.email ? { email_address: body.email } : undefined,
          application_context: {
            brand_name: "Love & Love YAH",
            user_action: "PAY_NOW",
            shipping_preference: "GET_FROM_FILE",
            return_url: origin + "/order-thanks?gateway=paypal",
            cancel_url: origin + "/checkout?canceled=1"
          }
        }
      });
      return json(res, 200, { url: approveLink(order), id: order.id, quote: q });
    }

    if (action === "capture") {
      const token = body.token || body.order_id;
      if (!token) return json(res, 400, { error: "Missing PayPal order token." });
      const cap = await pp("/v2/checkout/orders/" + encodeURIComponent(token) + "/capture", { method: "POST" });
      const unit = cap.purchase_units?.[0];
      const payment = unit?.payments?.captures?.[0];
      const totalCents = Math.round(Number(payment?.amount?.value || 0) * 100);
      const donationCents = Number(String(unit?.custom_id || "").split(":")[2] || 0);
      const ship = unit?.shipping?.address || {};
      const order = {
        gateway: "paypal", ref: payment?.id || cap.id,
        email: cap.payer?.email_address,
        name: [cap.payer?.name?.given_name, cap.payer?.name?.surname].filter(Boolean).join(" "),
        items: (unit?.items || []).map((i) => ({
          name: i.name, qty: Number(i.quantity),
          totalCents: Math.round(Number(i.unit_amount?.value || 0) * 100) * Number(i.quantity)
        })),
        subtotalCents: Math.round(Number(unit?.amount?.breakdown?.item_total?.value || 0) * 100),
        discountCents: Math.round(Number(unit?.amount?.breakdown?.discount?.value || 0) * 100),
        shippingCents: Math.round(Number(unit?.amount?.breakdown?.shipping?.value || 0) * 100),
        taxCents: Math.round(Number(unit?.amount?.breakdown?.tax_total?.value || 0) * 100),
        totalCents, donationCents,
        coupon: String(unit?.custom_id || "").split(":")[1] || null,
        address: {
          line1: ship.address_line_1, line2: ship.address_line_2, city: ship.admin_area_2,
          state: ship.admin_area_1, postal: ship.postal_code, country: ship.country_code
        },
        status: (cap.status || "completed").toLowerCase(), raw: { order: cap.id }
      };
      await recordOrder(order);
      await sendOrderEmail(order);
      return json(res, 200, { ok: true, status: cap.status, order: { ref: order.ref, totalCents, donationCents } });
    }

    return json(res, 400, { error: "Unknown action." });
  } catch (e) {
    console.error("[checkout-paypal]", action, e.message);
    if (/ORDER_ALREADY_CAPTURED/i.test(e.message)) return json(res, 200, { ok: true, status: "COMPLETED" });
    return json(res, 502, { error: "PayPal couldn't complete this request." });
  }
}
