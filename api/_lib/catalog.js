// Server-side product truth. The client sends ids + quantities only; every
// price, discount, shipping rate and tax figure below is computed here.
// Swap CATALOG/COUPONS for database reads when the products table exists —
// nothing else in the checkout flow needs to change.

export const CATALOG = {
  "wood-1": { name: "Carved Wall Cross", cents: 8800, category: "Woodworking" },
  "wood-2": { name: "Family Verse Sign", cents: 14000, category: "Woodworking" },
  "wood-3": { name: "Walnut Prayer Box", cents: 9600, category: "Woodworking" },
  "wood-4": { name: "Communion Tray", cents: 18000, category: "Woodworking" },
  "wood-5": { name: "Live-Edge Shelf", cents: 21000, category: "Woodworking" },
  "wood-6": { name: "Engraved Bible Stand", cents: 12000, category: "Woodworking" },
  "glass-1": { name: "Stained Cross Panel", cents: 32000, category: "Glasswork" },
  "glass-2": { name: "Dove Suncatcher", cents: 7800, category: "Glasswork" },
  "glass-3": { name: "Fused Verse Tile", cents: 11000, category: "Glasswork" },
  "glass-4": { name: "Chapel Window Study", cents: 54000, category: "Glasswork" },
  "glass-5": { name: "Rose Window Round", cents: 26000, category: "Glasswork" },
  "glass-6": { name: "Candle Lantern", cents: 14000, category: "Glasswork" }
};

// Variant products. Product pages build cart ids as
//   "<prefix>-<size>-<color>-<price>"  e.g. "kw-M-Cloud Pink-40"
// The trailing price must be one of that product's published tiers, so the
// id alone determines what is charged. Ids without a tier fall back to the
// base (lowest) price.
export const PRODUCTS = {
  bh:  { name: "Faith Over Fear Tee · Bauhaus", category: "T-Shirts", tiers: [3600, 4200, 5000] },
  bg:  { name: "Faith Over Fear Tee · Bold Graphic Streetwear", category: "T-Shirts", tiers: [3600, 4200, 5200] },
  bt:  { name: "Faith Over Fear Tee · Botanical Organic", category: "T-Shirts", tiers: [3600, 4200, 5000] },
  yc:  { name: "Faith Over Fear Tee · Y2K Chrome", category: "T-Shirts", tiers: [3800, 4400, 5200] },
  dc:  { name: "Faith Over Fear Tee · Art Deco Luxe", category: "T-Shirts", tiers: [4800, 5400, 6200] },
  dh:  { name: "Faith Over Fear Tee · Denim Heritage", category: "T-Shirts", tiers: [3800, 4400, 5200] },
  dd:  { name: "Faith Over Fear Tee · Hand-drawn Doodle", category: "T-Shirts", tiers: [3200, 3800, 4600] },
  dg:  { name: "Faith Over Fear Tee · Dreamy Gradient", category: "T-Shirts", tiers: [3600, 4200, 5000] },
  rf:  { name: "Faith Over Fear Tee · Renaissance Fresco", category: "T-Shirts", tiers: [4200, 4800, 5800] },
  gf:  { name: "Faith Over Fear Tee · Graffiti Mural", category: "T-Shirts", tiers: [3600, 4200, 5200] },
  kw:  { name: "Faith Over Fear Tee · Kawaii Pastel", category: "T-Shirts", tiers: [3400, 4000, 4800] },
  nn:  { name: "Faith Over Fear Tee · Neon Night", category: "T-Shirts", tiers: [3600, 4200, 5200] },
  pb:  { name: "Faith Over Fear Tee · Park Badge", category: "T-Shirts", tiers: [3600, 4200, 5000] },
  pp:  { name: "Faith Over Fear Tee · Punk Poster", category: "T-Shirts", tiers: [3400, 4000, 4800] },
  rz:  { name: "Faith Over Fear Tee · Riso Zine", category: "T-Shirts", tiers: [3400, 4000, 4800] },
  bs:  { name: "Faith Over Fear Tee · Brutalist Swiss", category: "T-Shirts", tiers: [3400, 4000, 4800] },
  fof: { name: "Faith Over Fear Tee · Terminal Hacker", category: "T-Shirts", tiers: [3200, 3800, 4600] },
  cv:  { name: "Faith Over Fear Tee · Collegiate Varsity", category: "T-Shirts", tiers: [3400, 4000, 4800] }
};

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "OS"];

/** "kw-M-Cloud Pink-40" → { name, category, cents }. Null when unresolvable. */
export function resolveVariant(id) {
  const parts = String(id).split("-");
  if (parts.length < 3) return null;
  const p = PRODUCTS[parts[0]];
  if (!p) return null;
  const size = parts[1];
  if (!SIZES.includes(size.toUpperCase())) return null;
  let rest = parts.slice(2);
  let cents = p.tiers[0];
  const tail = rest[rest.length - 1];
  if (/^\d+(\.\d+)?$/.test(tail)) {
    const asked = Math.round(Number(tail) * 100);
    if (!p.tiers.includes(asked)) return null;   // tampered price — refuse
    cents = asked;
    rest = rest.slice(0, -1);
  }
  const color = rest.join("-").trim();
  if (!color) return null;
  return { name: p.name + " · " + size.toUpperCase() + " · " + color, category: p.category, cents };
}

export const COUPONS = {
  GIVE10: { pct: 10, label: "10% off" },
  WELCOME5: { flatCents: 500, label: "$5 off" }
};

export const FREE_SHIP_THRESHOLD = 7500;  // $75
export const FLAT_SHIP_CENTS = 695;       // $6.95
export const REMOTE_SURCHARGE = 1200;     // AK / HI
export const TAX_RATE = 0.07;             // fallback only — see below
export const DONATION_RATE = 0.10;        // the 10% give-back promise

/** Resolve client line items against the catalog. Unknown ids are rejected. */
export function priceCart(items) {
  if (!Array.isArray(items) || !items.length) return { error: "Your cart is empty." };
  const lines = [];
  for (const raw of items) {
    const id = raw && raw.id;
    const p = CATALOG[id] || resolveVariant(id);
    if (!p) return { error: "One of the items in your cart is no longer available." };
    const qty = Math.max(1, Math.min(99, Math.round(Number(raw.qty) || 1)));
    lines.push({ id, name: p.name, category: p.category, unitCents: p.cents, qty, totalCents: p.cents * qty });
  }
  const subtotalCents = lines.reduce((s, l) => s + l.totalCents, 0);
  return { lines, subtotalCents };
}

export function couponFor(code) {
  const c = COUPONS[String(code || "").trim().toUpperCase()];
  return c || null;
}

export function discountCents(coupon, subtotalCents) {
  if (!coupon) return 0;
  const d = coupon.pct ? Math.round(subtotalCents * (coupon.pct / 100)) : coupon.flatCents;
  return Math.min(d, subtotalCents);
}

export function shippingCents(subtotalCents, state) {
  let rate = subtotalCents >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIP_CENTS;
  const s = String(state || "").toUpperCase();
  if (s === "AK" || s === "HI") rate += REMOTE_SURCHARGE;
  return rate;
}

/** Flat estimate. Set STRIPE_TAX=1 to hand tax to Stripe Tax instead —
 *  a real rate engine is required before this is a compliant production number. */
export function taxCents(taxableCents) {
  return Math.round(taxableCents * TAX_RATE);
}

export function quote({ items, coupon, state }) {
  const priced = priceCart(items);
  if (priced.error) return priced;
  const c = couponFor(coupon);
  const discount = discountCents(c, priced.subtotalCents);
  const afterDiscount = priced.subtotalCents - discount;
  const shipping = shippingCents(priced.subtotalCents, state);
  const tax = taxCents(afterDiscount);
  return {
    lines: priced.lines,
    subtotalCents: priced.subtotalCents,
    coupon: c ? { code: String(coupon).trim().toUpperCase(), label: c.label } : null,
    discountCents: discount,
    shippingCents: shipping,
    taxCents: tax,
    totalCents: afterDiscount + shipping + tax,
    donationCents: Math.round(afterDiscount * DONATION_RATE)
  };
}
