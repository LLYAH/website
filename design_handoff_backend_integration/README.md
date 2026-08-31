# Handoff: Love & Love YAH — Full Site + Backend Integration

## Overview
Love & Love YAH is a faith-based e-commerce and ministry site: apparel/home-goods shop (13 categories, 100+ product pages), a shopping cart + checkout flow, a donation page, a 24/7 radio page, prayer/contact forms, and free downloadable scripture-graphics resources. The frontend is fully designed and built as static HTML/CSS/JS. **None of it is wired to a real backend** — cart/checkout, radio playback, downloads, donations, and forms are all UI-only right now. This package is the spec for building that backend and connecting it.

## About the design files
Every `.html` file at the project root and in the category subfolders (`t-shirts/`, `hoodies/`, `jewelry/`, `hats/`, `mugs/`, `posters/`, `paintings/`, `stickers/`, `magnets/`, `cups/`, `tumblers/`, `woodworking/`, `glasswork/`) is a **finished, high-fidelity design reference** — real copy, real layout, real interactions (client-side only). Treat this whole folder as the source of truth for visual design and copy. Your job is not to redesign these pages — it's to:
1. Choose a framework (Next.js is the natural fit for a Vercel deployment with API routes/serverless functions; plain static HTML + Vercel Functions also works if you want to keep the current files largely as-is).
2. Recreate/port these pages into that framework's structure.
3. Replace the stubbed-out client-side logic (localStorage cart, alert() placeholders, hardcoded catalog) with real backend-backed functionality per the specs below.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final. Do not rewrite copy. Do not change visual design except where a feature (e.g. real payment redirect, real audio player, file downloads) requires new UI states (loading, error, success) — match the existing visual language when adding those (same font, corner radii, button styles, color palette below).

## Design tokens
- **Fonts:** "Hanken Grotesk" (400/500/600/700/800) is the primary UI/body font, loaded from Google Fonts. Several product pages also use Anton, Space Grotesk, Libre Caslon Display, Yeseva One, Epilogue, Caveat, Fredoka, DM Mono for one-off product graphics — not needed for backend/app chrome.
- **Colors:** background #fff, ink #1A1917, muted text #5a4f49 / #8a7a6a, primary accent blue #41A5EE (buttons/CTAs), link/active blue #185ABD, dark gradient footer/nav-dark `linear-gradient(160deg,#302D2A 0%,#1A1917 55%,#0D0C0B 100%)`. Section accent colors (used as colored card backgrounds site-wide): #54AAEC, #5DC8BA, #A288D8, #E9A945, #86B76E, #E68397.
- **Radii:** 9–12px on inputs/buttons, 14–18px on cards.
- **Spacing:** generous — 24–44px section padding, max content widths 620–1180px depending on section.

## Global architecture already in place
- `site.css` — all shared styles (inline styles are used for most page content; this file covers nav, footer, shared component classes).
- `site.js` — shared interactive behavior: collection filters, testimonial/verse carousels, play/pause button state toggling, category chip selection. Purely presentational, no data fetching.
- `site-chrome.js` — defines two web components, `<site-nav>` and `<site-footer>`, injected on every page (`<site-nav base=""></site-nav>` / `<site-nav base="../">` from subfolders). Renders the full mega-menu (all 13 shop categories + subcategories), Daily Bread menu, Free Resources menu, and cart-count pill. **Port this nav/footer structure directly into your framework's layout component** — do not rebuild it from scratch, its category/subcategory data structure (`CATS`, `SUBS`, `THEMES` objects at the top of the file) is the full site IA.
- `cart.js` — `window.LLYCart`: a localStorage-backed cart (key `llyCart`) with a **hardcoded 12-item demo catalog** (`CATALOG`) and **two hardcoded coupon codes** (`GIVE10`, `WELCOME5`). This is the piece that must become real: real product catalog from a database, real cart persisted server-side (or at minimum a real session/cookie-backed cart), real coupon validation.
- `vercel.json` — minimal, just `cleanUrls` + no trailing slash. Fine as-is for a static/Next.js deploy.

## Screens / Views & what each needs on the backend

### 1. Shop pages (`index.html`, `t-shirts.html`, `hoodies.html`, `jewelry.html`, `hats.html`, `mugs.html`, `posters.html`, `paintings.html`, `stickers.html`, `magnets.html`, `cups.html`, `tumblers.html`, `woodworking.html`, `glasswork.html`, and every page inside their subfolders e.g. `t-shirts/faith-over-fear-neon-tee.html`)
- **Purpose:** Browse and view individual products.
- **Current state:** Fully static markup per product (SVG mockups as placeholders for real product photography — flag to the user that real product photos should replace the inline SVGs before launch). No real price/inventory/variant data anywhere.
- **Needed:** A `products` table/collection (id, name, category, subcategory, price, description, variant options [size/color], images, stock/inventory flag, active/draft status). Render product data from this source instead of hardcoded HTML per page — likely means converting each static product page into a dynamic route (`/t-shirts/[slug]`) driven by a CMS or database rather than 100+ hand-written HTML files. Recommend a headless commerce/CMS layer here (see Recommended Stack below) rather than reinventing inventory management.

### 2. Cart (`cart.html`)
- **Layout:** Two-column — line items + coupon box + shipping estimator on the left, sticky order-summary card on the right (`cart-grid`, collapses to 1 col under 900px).
- **Current logic (in-page `<script>` + `cart.js`):** Renders `LLYCart.getCart()` into `#cr-items`; qty steppers call `LLYCart.updateQty`; coupon applies from the hardcoded `COUPONS` object; shipping estimate is a flat rule (`free ≥ $75, else $6.95, +$12 AK/HI`) with no real carrier API; tax is a flat 7% — **not real sales tax**.
- **Needed:**
  - Real cart persistence (server session or signed cookie + DB row), not just localStorage — required so cart survives across devices and so checkout can trust cart contents server-side (client-side prices must never be trusted at checkout).
  - Real coupon validation against a `coupons` table (code, type flat/pct, expiry, usage limits, min order).
  - Real shipping rates — either a flat-rate table you configure, or a live carrier-rate API (Shippo, EasyPost, or Stripe Tax/Shipping if using Stripe).
  - Real sales tax calculation (Stripe Tax, TaxJar, or Avalara — do not ship a flat 7% approximation to production).

### 3. Checkout (`checkout.html`)
- **Layout:** Two-column form (contact, shipping address, order notes, payment method radio) + sticky order summary, "Place order" button.
- **Current logic:** `ckPlaceOrder()` reads a `STRIPE_CHECKOUT_URL` / `PAYPAL_LINK` variable (both empty strings) and otherwise shows an `alert()`. **This is the single most important piece to replace.**
- **Needed (Stripe path, recommended):**
  1. Serverless function (Vercel Function) `POST /api/checkout` that receives the cart (or re-derives it server-side from the persisted cart/session — do not trust client-submitted prices), creates a Stripe Checkout Session (or PaymentIntent if building a fully custom form) server-side with `line_items` built from your real product/price data, and returns the session URL.
  2. Frontend calls that endpoint on "Place order" and redirects to the returned Stripe URL instead of a hardcoded link.
  3. A `POST /api/webhooks/stripe` endpoint (Vercel Function) that listens for `checkout.session.completed`, writes the order to your database, decrements inventory, and triggers a confirmation email.
  4. Order confirmation page/route to redirect Stripe back to (`checkout.html` doesn't currently have a success/cancel state — add one).
  - PayPal is offered as a second payment method in the UI; either implement PayPal Checkout SDK similarly or drop the option if only Stripe will be supported at launch — flag this choice to the user.
  - The 10% "automatically donated" copy on both cart and checkout implies you should log a `donation_amount` per order (10% of subtotal) for the give-back reporting mentioned on `give-back.html` — confirm with the user whether that's a real ledger they want to see/report from.

### 4. Donate (`donate.html`)
- **Layout:** Centered single card — frequency toggle (one-time/monthly), amount grid ($10/$25/$50/$100 + custom), Stripe/PayPal buttons.
- **Current logic:** `dnGo()` reads from a `STRIPE_LINKS` object (all values empty strings, keyed by frequency → amount) and a `PAYPAL_LINK` string. Comments in the file explain the intended manual approach (Stripe Payment Links per amount) but that doesn't support arbitrary custom amounts or a clean monthly-subscription flow.
- **Needed:** Same serverless pattern as checkout — `POST /api/donate` creates a Stripe Checkout Session in `payment` mode (one-time) or `subscription` mode (monthly) with the dynamic amount, since arbitrary/custom amounts require a session created server-side rather than fixed Payment Links. This is a nonprofit-adjacent flow — confirm with the user whether they need Stripe's nonprofit-rate application, and whether donations need to generate tax-deduction receipts (implies capturing donor name/email/address and emailing a receipt after the webhook fires).

### 5. Radio (`radio.html`)
- **Layout:** Hero "now playing" panel with progress bar, play/pause/skip controls, animated EQ bars, volume — all fake/static. Below: 6 channel cards each with their own play button, an "up next" queue list, and a weekly schedule list — all hardcoded text, nothing plays audio.
- **Current logic:** `site.js`'s `.rd-play` click handler only toggles the ▶/❚❚ glyph and an animation-play-state CSS class — **no `<audio>` element exists anywhere in the file.**
- **Needed:**
  - Audio file hosting: Vercel Blob Storage (simplest, integrates directly with Vercel) or S3 — user uploads MP3/audio files, referenced by URL.
  - A `tracks` table (title, artist, channel, file URL, duration, order) and a `channels` table (the 6 channels shown: Hymns, Contemporary, 50s & 60s, 70s & 80s, 90s, Modern).
  - Real `<audio>` element(s) driven by a small player component: play/pause/skip/seek/volume wired to real playback state, "now playing" panel reflecting the actual current track, and either (a) simple on-demand playlist playback per channel (straightforward), or (b) true synchronized "live radio" where every listener hears the same point in the stream at the same time (requires a server-side clock/scheduler deciding what track+offset is "on air" right now, which the client seeks to on load — more work; confirm which the user actually wants, the "1,482 listening" and "on air" language implies live-radio-style, but on-demand playlists may be an acceptable and much simpler substitute).
  - "Up next" and "weekly schedule" panels should read from the same `tracks`/`channels` data rather than hardcoded HTML once real.

### 6. Bible verse zip downloads (`scripture-resources.html`)
- **Layout:** Platform picker (8 platforms) + style picker (4 styles) at the top, updating spec text and preview swatches; grid of 9 themed verse-set cards, each with a "Download [platform] · [style]" button.
- **Current logic:** `downloads.js` (`window.LLYDownloads`) implements this and works today. Each card carries `data-set`; the page wrapper carries `data-page`, `data-plat`, `data-style`. Clicking `.sr-dl` resolves (page, set, platform, style) to a **Vercel Blob URL by convention**, HEAD-probes it (result cached per URL for the page load), and downloads it with `?download=1` if it exists. If it does not exist the button shows "coming soon". Buttons have preparing/progress/done/failed states.
- **Vercel Blob contract — this is the only thing left to do.** Set `LLYDownloads.CONFIG.blobBase` in `downloads.js` to the public blob base URL (no trailing slash), then upload zips at exactly:

  ```
  {blobBase}/{page}/{set}/{set}-{platform-slug}-{style}.zip
  ```

  - `page` — `scripture` | `inspirational`
  - `set` — the `data-set` value on the card; the full list is in `CATALOG` in `downloads.js` (scripture: `verse-a-day`, `love`, `strength`, `jesus`, `deliverance`, `marriage`, `holy-spirit`, `forgiveness`, `faith`; inspirational: `encouragement`, `hope`, `strength`, `identity`, `faith-over-fear`, `family`, `gratitude`)
  - `platform-slug` — `PLATFORMS[key].slug`: `facebook-1200x630`, `facebook-reels-1080x1920`, `instagram-1080x1350`, `instagram-story-1080x1920`, `x-1600x900`, `tiktok-1080x1920`, `youtube-1280x720`, `truth-social-1200x675`
  - `style` — `bold` | `modern` | `urban` | `elegant`

  Example: `.../downloads/scripture/love/love-facebook-1200x630-bold.zip`. No code change is needed as files land — upload and the button starts working. Blobs must be public and CORS-readable so the HEAD probe succeeds (a failed probe degrades to "coming soon", not an error).
- **Going live:** set `CONFIG.blobOnly = true` in `downloads.js` at the same time you set `blobBase`. That disables the client-side builder entirely, so the live site serves only zips that really exist on Blob and shows "coming soon" for anything not yet uploaded — it can never hand a visitor a 9-image sample zip in place of the 365-graphic set the card advertises. Leave it `false` only for local/staging demos.
- **Overrides / fallbacks:** `HOSTED["page/set/platform/style"] = url` pins one combination to an arbitrary URL. With `blobBase` empty, the client builds a zip itself from loose PNGs: each set lists its filenames **once** in `CATALOG[page][set].files`, and `STYLE_DIR` maps the four art styles to the folders those same filenames live in (`uploads/`, `uploads/modern/`, `uploads/urban/`, `uploads/elegant/`). Files missing from a style's folder are skipped; if none are found the combination reports "coming soon". Today only `uploads/` (bold) is populated — dropping the same filenames into the other three folders turns those styles on with no code change.
- **Optional server involvement** (download counts, gated access): point `blobBase` at `/api/download` and have that function 302 to the blob — the client routes everything through one resolver, so nothing else changes.
- **Original spec, for reference:**
  - File storage for the zips: Vercel Blob or S3. Given 9 verse-sets × 8 platform sizes × 4 styles is a lot of combinations, confirm with the user how many actual zip files exist/will be produced (likely far fewer than the full matrix — e.g. one zip per verse-set+platform combo, style may just reflect existing image style already baked into that platform's zip).
  - A mapping (verse-set, platform, style) → file URL, and a real `href`/`onclick` on each `.sr-dl` button that either links directly to the stored zip or hits a small `/api/download?set=...&platform=...&style=...` endpoint that redirects to the correct file (a serverless endpoint is nice for tracking download counts, but a direct static link is simpler and sufficient if analytics aren't needed).
  - Same download pattern likely applies to `inspirational-graphics.html` (not fully reviewed here — check it for the same "free download" pattern).

### 7. Contact (`contact.html`) and Prayer Requests (`prayer.html`)
- **Layout — Contact:** Name/email/subject-dropdown/message form + static contact info sidebar (email, studio location, hours).
- **Layout — Prayer:** Phone/email CTAs (`tel:`/`mailto:` links, already functional) + a form (name, phone, email, category chips, message, two checkboxes for "keep private" / "check in weekly").
- **Current logic:** Both forms have `onsubmit="return false"` and a submit button with **no handler at all** — nothing happens on submit.
- **Needed:** A `POST /api/contact` and `POST /api/prayer` serverless function each. Recommended: validate input server-side, store the submission in a database table (so nothing is ever lost even if email fails), and send a notification email via Resend/SendGrid/Postmark to the relevant inbox (`hello@loveandloveyah.com` / `team@loveandloveyah.com` per contact.html; `prayer@loveandloveyah.com` per prayer.html). Show a real success/error state in the UI in place of the current no-op. Prayer requests explicitly need a "private" flag respected in storage/access (per the checkbox copy) and, if "check in weekly" is checked, that's a recurring task — flag to the user whether that's a manual team process or something they want automated (e.g. a scheduled reminder email to the team).

## State management (frontend)
- Cart state currently lives in `localStorage.llyCart` (array of `{id, name, price, color, category, qty}`) and is read/written through the `window.LLYCart` API in `cart.js`, with a `cart:change` CustomEvent broadcast on every mutation so nav pill / cart / checkout pages can re-render. Preserve this event-driven update pattern when you move cart state to a real backend — swap the localStorage read/writes for API calls but keep dispatching `cart:change` (or your framework's equivalent state update) so all the pill/cart/checkout UI stays in sync without a rewrite.
- Radio, donate, checkout, and both forms are currently uncontrolled/stateless beyond simple UI toggles (`dnState` object in `donate.html`, payment radio in `checkout.html`) — fine to keep as local component state once ported, just wire the final submit actions to real endpoints.

## Recommended stack for Vercel deployment
- **Framework:** Next.js (App Router) — first-class Vercel support, API routes/Server Actions cover every backend need below without a separate server.
- **Database:** Vercel Postgres (Neon-backed) or Supabase — either handles products, orders, coupons, contact/prayer submissions, tracks/channels.
- **File storage:** Vercel Blob — for scripture zip files and radio audio uploads; simplest same-platform integration.
- **Payments:** Stripe (Checkout Sessions + webhooks) for both checkout and donations; add PayPal only if the user confirms they want it as a second option.
- **Email:** Resend (built by Vercel's ecosystem, simple API) for contact/prayer notifications and order/donation receipts.
- **Tax/shipping:** Stripe Tax for real sales tax; Shippo or EasyPost for live shipping rates, or a configured flat-rate table if the user wants to keep it simple at launch.
- This is a recommendation, not a requirement — Supabase, PlanetScale, SendGrid etc. are equally valid; the point is every piece above needs *some* real service behind it before "fully functional" is accurate.

## Assets
- Product mockups on `index.html` and category pages are hand-drawn inline SVGs standing in for real product photography — replace with real photos before launch (flag to user).
- `uploads/` contains 9 real PNG scripture-verse graphics (used as preview thumbnails on `scripture-resources.html`) — these are likely samples from the actual zip contents the user will supply.
- Social icons in the footer (`site-chrome.js`, `SOCIAL` array) are inline SVGs, functional as-is; footer social links currently point to `#` — needs real URLs.

## Files
Everything in this project folder is in scope. Key files to start with, in priority order: `site-chrome.js` (nav/footer + full IA), `cart.js` + `cart.html` + `checkout.html` (commerce core), `donate.html`, `radio.html`, `scripture-resources.html`, `contact.html`, `prayer.html`, `site.css`, `site.js`, `vercel.json`. Category/product pages (root `*.html` shop pages + all files under `t-shirts/`, `hoodies/`, `jewelry/`, `hats/`, `mugs/`, `posters/`, `paintings/`, `stickers/`, `magnets/`, `cups/`, `tumblers/`, `woodworking/`, `glasswork/`) are lower priority to port first since they're closer to done — same static-to-dynamic conversion applies to all of them once the product data model exists.
