// Minimal PayPal REST client (Orders v2 + Subscriptions v1) over fetch.

const BASE = () => (process.env.PAYPAL_ENV === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com");

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function token() {
  const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_CLIENT_SECRET).toString("base64");
  const r = await fetch(BASE() + "/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const j = await r.json();
  if (!r.ok) throw new Error("PayPal auth failed: " + (j.error_description || r.status));
  return j.access_token;
}

export async function pp(path, { method = "GET", body, requestId } = {}) {
  const headers = {
    Authorization: "Bearer " + (await token()),
    "Content-Type": "application/json"
  };
  if (requestId) headers["PayPal-Request-Id"] = requestId;
  const r = await fetch(BASE() + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  const j = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const msg = j.message || j.error_description || r.status;
    throw new Error("PayPal " + path + ": " + msg);
  }
  return j;
}

export function approveLink(obj) {
  const l = (obj.links || []).find((x) => x.rel === "approve" || x.rel === "payer-action");
  return l && l.href;
}

/** Monthly gifts need a plan. One plan per (amount) is created on demand and
 *  reused via a deterministic PayPal-Request-Id, so repeat gifts don't pile up. */
export async function monthlyPlan(cents) {
  const productId = await ministryProduct();
  const key = "lly-plan-" + cents;
  try {
    const plan = await pp("/v1/billing/plans", {
      method: "POST",
      requestId: key,
      body: {
        product_id: productId,
        name: "Monthly donation " + (cents / 100).toFixed(2) + " USD",
        status: "ACTIVE",
        billing_cycles: [{
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: (cents / 100).toFixed(2), currency_code: "USD" } }
        }],
        payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: "CONTINUE", payment_failure_threshold: 2 }
      }
    });
    return plan.id;
  } catch (e) {
    // Duplicate request id → find the existing plan for this amount.
    const list = await pp("/v1/billing/plans?product_id=" + productId + "&page_size=20&total_required=true");
    const match = (list.plans || []).find((p) => p.name === "Monthly donation " + (cents / 100).toFixed(2) + " USD");
    if (match) return match.id;
    throw e;
  }
}

async function ministryProduct() {
  if (process.env.PAYPAL_PRODUCT_ID) return process.env.PAYPAL_PRODUCT_ID;
  const p = await pp("/v1/catalogs/products", {
    method: "POST",
    requestId: "lly-giving-product",
    body: { name: "Love & Love YAH Giving", type: "SERVICE", category: "CHARITY" }
  });
  return p.id;
}
