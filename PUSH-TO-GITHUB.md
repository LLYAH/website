# Push this site to GitHub

Target repo: **LLYAH/website**, branch **main** (already exists — see `github.md`).

## What this bundle is
The production static site for Love and Love YAH, plus the serverless API stubs it expects.

```
index.html                 Home
cart.html / cart.js        Cart page + cart state (localStorage)
checkout.html              Checkout form -> /api/checkout
donate.html                Donations -> /api/donate
order-thanks.html
donate-thanks.html
radio.html                 Radio player
scripture-resources.html   Verse image zip downloads (downloads.js, verses.js)
inspirational-graphics.html
daily-verse.html devotional.html affirmations.html
prophetic-word.html testimonies.html warfare.html (+ warfare.json)
prayer.html contact.html give-back.html
site.css site.js site-chrome.js   Shared styles, interactions, nav/footer injection
<category>.html + <category>/*.html   13 shop categories and their product pages
uploads/                   Verse graphics used by the site
api/                       Vercel serverless functions (Stripe + PayPal, see api/README.md)
vercel.json                cleanUrls: true, trailingSlash: false
package.json               stripe, postgres (Supabase)
.env.example               Required environment variables
design_handoff_backend_integration/README.md   Backend spec for cart/checkout/payments/db
```

## Steps for Claude Code

1. Clone or open `LLYAH/website` on `main`.
2. Copy the contents of this bundle over the working tree, preserving directory structure.
3. Do **not** commit: `*.dc.html`, `support.js`, `.thumbnail`, `screenshots/`, `node_modules/`, `.env`. A `.gitignore` covering these is included — commit it.
4. `git add -A` and commit, e.g. `Sync site from design source`.
5. Push to `origin main`.

## Notes
- Pages are plain HTML with no build step; `vercel.json` uses clean URLs, so internal links omit `.html`.
- `site-chrome.js` injects the shared header/footer into every page — new pages must include it.
- Backend work (real payments, order persistence, form handling, download gating) is specified in `design_handoff_backend_integration/README.md`; `api/` currently holds the endpoint scaffolding.
- Do not rewrite copy or restyle pages while syncing.
