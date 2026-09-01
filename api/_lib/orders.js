// Order ledger + confirmation email. Mirrors donations.js: Postgres when
// POSTGRES_URL is set, function logs otherwise. Idempotent on gateway_ref.

import { money } from "./util.js";

let sqlPromise = null;
function getSql() {
  if (!process.env.POSTGRES_URL) return null;
  if (!sqlPromise) {
    sqlPromise = import("@vercel/postgres").then((m) => m.sql)
      .catch((e) => { console.error("[orders] @vercel/postgres unavailable:", e.message); return null; });
  }
  return sqlPromise;
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id             BIGSERIAL PRIMARY KEY,
      gateway        TEXT NOT NULL,
      gateway_ref    TEXT NOT NULL UNIQUE,
      email          TEXT,
      name           TEXT,
      items          JSONB,
      subtotal_cents INTEGER NOT NULL DEFAULT 0,
      discount_cents INTEGER NOT NULL DEFAULT 0,
      shipping_cents INTEGER NOT NULL DEFAULT 0,
      tax_cents      INTEGER NOT NULL DEFAULT 0,
      total_cents    INTEGER NOT NULL DEFAULT 0,
      donation_cents INTEGER NOT NULL DEFAULT 0,
      coupon         TEXT,
      shipping_addr  JSONB,
      notes          TEXT,
      status         TEXT NOT NULL DEFAULT 'paid',
      raw            JSONB,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

export async function recordOrder(o) {
  const sql = await getSql();
  if (!sql) { console.log("[order]", JSON.stringify(o)); return { stored: false }; }
  try {
    await ensureTable(sql);
    await sql`
      INSERT INTO orders (gateway, gateway_ref, email, name, items, subtotal_cents, discount_cents,
                          shipping_cents, tax_cents, total_cents, donation_cents, coupon, shipping_addr, notes, status, raw)
      VALUES (${o.gateway}, ${o.ref}, ${o.email || null}, ${o.name || null}, ${JSON.stringify(o.items || [])},
              ${o.subtotalCents || 0}, ${o.discountCents || 0}, ${o.shippingCents || 0}, ${o.taxCents || 0},
              ${o.totalCents || 0}, ${o.donationCents || 0}, ${o.coupon || null},
              ${JSON.stringify(o.address || {})}, ${o.notes || null}, ${o.status || "paid"}, ${JSON.stringify(o.raw || {})})
      ON CONFLICT (gateway_ref) DO UPDATE SET status = EXCLUDED.status, raw = EXCLUDED.raw`;
    return { stored: true };
  } catch (e) {
    console.error("[orders] insert failed:", e.message, JSON.stringify(o));
    return { stored: false };
  }
}

export async function sendOrderEmail(o) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !o.email) return;
  const from = process.env.RECEIPT_FROM || "Love & Love YAH <orders@loveandloveyah.com>";
  const rows = (o.items || []).map((l) =>
    `<tr><td style="padding:6px 0">${l.name} × ${l.qty}</td><td style="padding:6px 0;text-align:right">${money(l.totalCents)}</td></tr>`).join("");
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#1A1917;line-height:1.6;max-width:520px">
    <p style="font-size:17px;font-weight:700;margin:0 0 12px">Your order is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      <tr><td style="padding:6px 0;border-top:1px solid #eee">Shipping</td><td style="padding:6px 0;text-align:right;border-top:1px solid #eee">${o.shippingCents ? money(o.shippingCents) : "Free"}</td></tr>
      <tr><td style="padding:6px 0">Tax</td><td style="padding:6px 0;text-align:right">${money(o.taxCents || 0)}</td></tr>
      <tr><td style="padding:6px 0;font-weight:700">Total</td><td style="padding:6px 0;text-align:right;font-weight:700">${money(o.totalCents || 0)}</td></tr>
    </table>
    <p style="margin:14px 0 0">${money(o.donationCents || 0)} of this order goes to our give-back partners.</p>
    <p style="margin:8px 0 0;color:#5a4f49;font-size:13px">Order reference: ${o.ref}</p>
  </div>`;
  const send = (to, subject) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html })
  }).then((r) => r.ok || r.text().then((t) => console.error("[resend]", t)));
  try {
    await send([o.email], "Your order · Love & Love YAH");
    if (process.env.ORDER_NOTIFY_TO) await send([process.env.ORDER_NOTIFY_TO], "New order " + money(o.totalCents || 0));
  } catch (e) { console.error("[resend] order email failed:", e.message); }
}
