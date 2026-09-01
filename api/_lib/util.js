// Shared helpers for the donation endpoints.

const MIN_CENTS = 100;        // $1
const MAX_CENTS = 10000000;   // $100,000

export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).send(JSON.stringify(body));
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

/** Never trust a client-sent amount blindly — clamp, round, and validate. */
export function parseAmount(input) {
  const n = Number(input);
  if (!isFinite(n) || n <= 0) return { error: "Enter a donation amount." };
  const cents = Math.round(n * 100);
  if (cents < MIN_CENTS) return { error: "Minimum donation is $1." };
  if (cents > MAX_CENTS) return { error: "For gifts over $100,000 please contact us directly." };
  return { cents };
}

export function parseFrequency(input) {
  return input === "monthly" ? "monthly" : "onetime";
}

export function siteOrigin(req) {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return proto + "://" + host;
}

export function money(cents) {
  return "$" + (cents / 100).toFixed(2);
}
