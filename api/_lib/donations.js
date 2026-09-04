// Donation ledger + receipt email.
// Postgres (Supabase) is optional: with no POSTGRES_URL the record is written
// to the function log so nothing is silently lost while the DB is being set up.

import { money } from "./util.js";
import postgres from "postgres";

let sql = null;
function getSql() {
  if (!process.env.POSTGRES_URL) return null;
  if (!sql) sql = postgres(process.env.POSTGRES_URL, { ssl: "require", prepare: false });
  return sql;
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS donations (
      id            BIGSERIAL PRIMARY KEY,
      gateway       TEXT NOT NULL,
      gateway_ref   TEXT NOT NULL UNIQUE,
      frequency     TEXT NOT NULL,
      amount_cents  INTEGER NOT NULL,
      currency      TEXT NOT NULL DEFAULT 'usd',
      donor_name    TEXT,
      donor_email   TEXT,
      status        TEXT NOT NULL DEFAULT 'completed',
      raw           JSONB,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

/** Idempotent: a duplicate webhook delivery updates rather than double-counts. */
export async function recordDonation(d) {
  const sql = await getSql();
  if (!sql) {
    console.log("[donation]", JSON.stringify(d));
    return { stored: false };
  }
  try {
    await ensureTable(sql);
    await sql`
      INSERT INTO donations (gateway, gateway_ref, frequency, amount_cents, currency, donor_name, donor_email, status, raw)
      VALUES (${d.gateway}, ${d.ref}, ${d.frequency}, ${d.amountCents}, ${d.currency || "usd"},
              ${d.name || null}, ${d.email || null}, ${d.status || "completed"}, ${JSON.stringify(d.raw || {})})
      ON CONFLICT (gateway_ref) DO UPDATE SET status = EXCLUDED.status, raw = EXCLUDED.raw`;
    return { stored: true };
  } catch (e) {
    console.error("[donations] insert failed:", e.message, JSON.stringify(d));
    return { stored: false };
  }
}

export async function sendReceipt(d) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !d.email) return;
  const from = process.env.RECEIPT_FROM || "Love & Love YAH <giving@loveandloveyah.com>";
  const recurring = d.frequency === "monthly";
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#1A1917;line-height:1.6">
    <p style="font-size:17px;font-weight:700;margin:0 0 12px">Thank you for your gift.</p>
    <p style="margin:0 0 12px">We received your ${recurring ? "monthly" : "one-time"} donation of <b>${money(d.amountCents)}</b>${recurring ? " — it will recur each month until you cancel." : "."}</p>
    <p style="margin:0 0 12px">100% of it goes straight to our partners: clean water, youth ministry, meals, mental-health support, and the arts.</p>
    <p style="margin:0 0 4px;color:#5a4f49;font-size:13px">Reference: ${d.ref}</p>
    <p style="margin:0;color:#5a4f49;font-size:13px">Keep this email for your tax records.</p>
  </div>`;
  const send = (to, subject) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html })
  }).then((r) => r.ok || r.text().then((t) => console.error("[resend]", t)));

  try {
    await send([d.email], "Your donation receipt · Love & Love YAH");
    if (process.env.DONATION_NOTIFY_TO) {
      await send([process.env.DONATION_NOTIFY_TO], `New ${recurring ? "monthly" : "one-time"} donation ${money(d.amountCents)}`);
    }
  } catch (e) { console.error("[resend] failed:", e.message); }
}
