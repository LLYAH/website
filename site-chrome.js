/* Shared nav + footer for the Love & Love YAH site.
   Usage: <site-nav base="./"></site-nav>  /  <site-footer base="../"></site-footer> */
(function () {
  const CATS = [
    ["clothing-apparel", "Clothing &amp; Apparel"],
    ["t-shirts", "T-Shirts"],
    ["hoodies", "Hoodies &amp; Sweatshirts"],
    ["jewelry", "Jewelry"],
    ["hats", "Hats &amp; Headwear"],
    ["mugs", "Coffee Mugs"],
    ["posters", "Posters &amp; Wall Art"],
    ["paintings", "Paintings"],
    ["stickers", "Stickers &amp; Decals"],
    ["magnets", "Magnets"],
    ["cups", "Cups &amp; Glasses"],
    ["tumblers", "Tumblers &amp; Water Bottles"],
    ["woodworking", "Woodworking"],
    ["glasswork", "Glasswork"]
  ];
  const SUBS = {
    "hats": [["Baseball Cap", "christian-baseball-hat"], ["Beanie", "beanie"], ["Bucket", "christian-bucket-hat"], ["Camo", "christian-camo-hat"], ["Fitted", "christian-fitted-hat"], ["Trucker", "christian-trucker-hat"], ["Mesh Back", "christian-mesh-back-hat"], ["Snapback", "christian-snapback-hat"], ["Visor", "visor"], ["Wide Brim Sun Hat", "wide-brim-sun-hat"]],
    "mugs": [["11Oz", "11oz"], ["15Oz", "15oz"], ["Camping", "christian-camping-coffee-cup"], ["Ceramic", "christian-ceramic-mug"], ["Coffee", "christian-coffee-cup"], ["Enamel", "christian-enamel-mug"], ["Gift Set", "christian-coffee-mug-gift-set"], ["Stoneware", "christian-stoneware-stone-coffee-mug"], ["Travel", "christian-travel-mug"]],
    "posters": [["Canvas", "canvas"], ["Scripture Posters", "bible-verse-scripture-posters"], ["Wall Art", "wall-art"]],
    "stickers": [["Decals", "christian-decals"], ["Vinyl Stickers", "christian-vinyl-stickers"], ["Bumper Stickers", "christian-bumper-sticker"]],
    "magnets": [["Car Magnet", "car-magnet"], ["Fridge Magnet", "fridge-magnet"], ["Locker Magnet", "locker-magnet"], ["Magnet Set", "magnet-set"]],
    "cups": [["Drinking Glass Set", "drinking-glass-set"], ["Mason Jar Cup", "mason-jar-cup"], ["Pint Glass", "pint-glass"], ["Rocks Glass", "rocks-glass"], ["Wine Glass", "wine-glass"]],
    "tumblers": [["20Oz Tumbler", "20oz-tumbler"], ["Glass Water Bottle", "glass-water-bottle"], ["Insulated Tumbler", "insulated-tumbler"], ["Skinny Tumbler", "skinny-tumbler"], ["Stainless Tumbler", "stainless-tumbler"], ["Stanley Style Tumbler", "stanley-style-tumbler"], ["Travel Water Bottle", "travel-water-bottle"], ["Tumbler With Straw", "tumbler-with-straw"], ["Water Bottle", "water-bottle"], ["Workout Bottle", "workout-bottle"]],
    "jewelry": [["Bracelets", "bracelets"], ["Earrings", "earrings"], ["Pendants", "pendants"], ["Necklaces", "necklaces"], ["Rings", "rings"]],
    "paintings": [["Canvas Painting Print", "canvas-painting-print"], ["Fine Art Print", "fine-art-print"], ["Framed Painting Print", "framed-painting-print"], ["Giclee Art Print", "giclee-art-print"], ["Hand-Painted Look Print", "hand-painted-look-print"], ["Oil Painting Style Print", "oil-painting-style-print"], ["Watercolor Style Print", "watercolor-style-print"]],
    "woodworking": [["Wood Signs &amp; Decor", "wood-signs-and-decor"], ["Wood Cut &amp; Engraving Files", "wood-cut-and-engraving-files"]],
    "glasswork": [["Etched Glass Decor", "etched-glass-decor"], ["Glass Block Decor", "glass-block-decor"], ["Glass Cross Ornament", "glass-cross-ornament"], ["Glass Keepsake Box", "glass-keepsake-box"], ["Glass Ornament", "glass-ornament"], ["Glass Wall Hanging", "glass-wall-hanging"], ["Stained Glass Suncatcher", "stained-glass-suncatcher"]]
  };
  /* categories shown in the top-level "Shop by category" rail — apparel sub-categories
     (T-Shirts, Hoodies, Hats) live under Clothing & Apparel instead */
  const RAIL_CATS = CATS.filter((c) => ["t-shirts", "hoodies", "hats"].indexOf(c[0]) === -1);
  /* [label, t-shirt slug, hoodie slug] */
  const THEMES = [
    ["Faith Statement", "faith-shirt", "faith-sweatshirt"],
    ["Jesus &amp; God", "jesus-shirt", "jesus-sweatshirt"],
    ["Yeshuah &amp; Yahushah", "yahweh-shirt", "yahweh-sweatshirt"],
    ["Cross", "cross-shirt", "cross-sweatshirt"],
    ["Holiday", "holiday", "holiday"],
    ["Bible Verse", "bible-verses-shirt", "bible-verses-sweatshirt"],
    ["Love", "love-shirt", "love-sweatshirt"]
  ];

  function subPanes(base, slug) {
    return SUBS[slug].map((it) =>
      '<a class="tsitem plain" href="' + base + "christian-" + slug + "/" + it[1] + '.html"><span class="tslbl">' + it[0] + "</span></a>"
    ).join("");
  }

  function themeItems(base, dir) {
    const i = dir === "hoodies" ? 2 : 1;
    return THEMES.map((t) =>
      '<a class="tsitem plain" href="' + base + "christian-" + dir + "/" + t[i] + '.html"><span class="tslbl">' + t[0] + "</span></a>"
    ).join("");
  }

  class SiteNav extends HTMLElement {
    connectedCallback() {
      const base = this.getAttribute("base") || "";
      const rail = RAIL_CATS.map(([slug, label], i) =>
        '<a class="catitem plain" href="' + base + "christian-" + slug + '.html" data-cat="' + slug + '"' +
        (i === 0 ? ' data-on="1"' : "") + ">" + label + "</a>"
      ).join("") +
        '<a class="catitem plain" href="' + base + 'christian-merch.html" data-cat="clothing-apparel" style="font-weight:800">All Merch</a>';
      const mobileCats = RAIL_CATS.map(([slug, label]) =>
        '<a class="plain" href="' + base + "christian-" + slug + '.html">' + label + "</a>"
      ).join("") +
        '<a class="plain" href="' + base + 'christian-merch.html" style="font-weight:800">All Merch</a>';
      const mobileClothing = [["Men&#39;s Clothing","mens-christian-clothing"],["Women&#39;s Clothing","womens-christian-clothing"],["Streetwear","christian-streetwear"],["Golf Wear","christian-golf-apparel"],["T-Shirts","christian-t-shirts"],["Hoodies &amp; Sweatshirts","christian-hoodies"],["Hats &amp; Headwear","christian-hats"],["Embroidery","christian-embroidery"],["Faith","faith-based-clothing"]].map(function (c) {
        return '<a class="plain" href="' + base + c[1] + '.html">' + c[0] + '</a>';
      }).join("");
      this.innerHTML =
        '<nav class="tsnav">' +
          '<a class="tsbrand plain" href="' + base + 'index.html"><span class="tsbrand-dot"></span>Love &amp; Love YAH</a>' +
          '<button class="tshamburger" type="button" aria-label="Open menu"><span></span></button>' +
          '<div class="tsnavlinks">' +
            '<div class="tsnav-ts">' +
              '<button class="tsbtn" type="button">Shop <span class="car">▼</span></button>' +
              '<div class="tsmenu">' +
                '<div class="megacats"><div class="tscolh" style="padding-left:10px">Shop by category</div>' + rail + "</div>" +
                '<div class="megacols megasubs" data-for="clothing-apparel"><div class="tscolh" style="grid-column:1/-1;margin:0 0 14px">Clothing &amp; Apparel — shop by collection</div>' +
                  '<a class="tsitem plain" href="' + base + 'mens-christian-clothing.html"><span class="tslbl">Men&#39;s Clothing</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'womens-christian-clothing.html"><span class="tslbl">Women&#39;s Clothing</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-streetwear.html"><span class="tslbl">Streetwear</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-golf-apparel.html"><span class="tslbl">Golf Wear</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-t-shirts.html"><span class="tslbl">T-Shirts</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-hoodies.html"><span class="tslbl">Hoodies &amp; Sweatshirts</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-hats.html"><span class="tslbl">Hats &amp; Headwear</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-embroidery.html"><span class="tslbl">Embroidery</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'faith-based-clothing.html"><span class="tslbl">Faith</span></a>' +
                  '<a class="tsitem plain" href="' + base + 'christian-clothing-apparel.html"><span class="tslbl" style="font-weight:700">All Clothing &amp; Apparel →</span></a>' +
                "</div>" +
                Object.keys(SUBS).map(function (slug) {
                  const label = (CATS.find((c) => c[0] === slug) || [slug, slug])[1];
                  return '<div class="megacols megasubs" data-for="' + slug + '" style="display:none"><div class="tscolh" style="grid-column:1/-1;margin:0 0 14px">' + label + ' — shop by type</div>' +
                    subPanes(base, slug) +
                    '<a class="tsitem plain" href="' + base + "christian-" + slug + '.html"><span class="tslbl" style="font-weight:700">All ' + label + ' →</span></a></div>';
                }).join("") +
              "</div>" +
            "</div>" +
            '<div class="tsnav-db">' +
              '<button class="dbbtn tslink" type="button">Daily Bread <span class="car">▾</span></button>' +
              '<div class="dbmenu">' +
                '<a class="tsitem plain" href="' + base + 'daily-verse.html"><span class="tslbl">Daily Verse</span></a>' +
                '<a class="tsitem plain" href="' + base + 'prophetic-word.html"><span class="tslbl">Daily Prophetic Word</span></a>' +
                '<a class="tsitem plain" href="' + base + 'devotional.html"><span class="tslbl">Daily Devotional</span></a>' +
                '<a class="tsitem plain" href="' + base + 'affirmations.html"><span class="tslbl">Daily Affirmations</span></a>' +
                '<a class="tsitem plain" href="' + base + 'warfare.html"><span class="tslbl">Daily Warfare Prayers</span></a>' +
                '<a class="tsitem plain" href="' + base + 'testimonies.html"><span class="tslbl">Testimonies</span></a>' +
              "</div>" +
            "</div>" +
            '<div class="tsnav-db">' +
              '<button class="dbbtn tslink" type="button">Worship <span class="car">▾</span></button>' +
              '<div class="dbmenu">' +
                '<a class="tsitem plain" href="' + base + 'radio.html"><span class="tslbl">Worship Music</span></a>' +
              "</div>" +
            "</div>" +
            '<div class="tsnav-db">' +
              '<button class="dbbtn tslink" type="button">Free Resources <span class="car">▾</span></button>' +
              '<div class="dbmenu">' +
                '<a class="tsitem plain" href="' + base + 'scripture-resources.html"><span class="tslbl">Bible Verses For Social Media</span></a>' +
                '<a class="tsitem plain" href="' + base + 'inspirational-graphics.html"><span class="tslbl">Inspirational Social Media Posts</span></a>' +
              "</div>" +
            "</div>" +
            '<a class="tslink plain" href="' + base + 'prayer.html">Prayer Request</a>' +
            '<a class="tslink plain" href="' + base + 'about.html">About</a>' +
            '<a class="tslink plain" href="' + base + 'donate.html">Donate</a>' +
            '<a class="plain cartpill" href="' + base + 'cart.html">Cart (0)</a>' +
          "</div>" +
        "</nav>" +
        '<div class="tsdrawer">' +
          '<div class="tsdrawer-overlay"></div>' +
          '<div class="tsdrawer-panel">' +
            '<div class="tsdrawer-head"><a class="tsbrand plain" href="' + base + 'index.html"><span class="tsbrand-dot"></span>Love &amp; Love YAH</a><button class="tsdrawer-close" type="button" aria-label="Close menu">&times;</button></div>' +
            '<details class="tsacc"><summary>Shop</summary><div class="tsacc-body">' + '<a class="plain" href="' + base + 'christian-clothing-apparel.html" style="font-weight:800">Clothing &amp; Apparel</a>' + mobileClothing + mobileCats + "</div></details>" +
            '<details class="tsacc"><summary>Daily Bread</summary><div class="tsacc-body">' +
              '<a class="plain" href="' + base + 'daily-verse.html">Daily Verse</a>' +
              '<a class="plain" href="' + base + 'prophetic-word.html">Daily Prophetic Word</a>' +
              '<a class="plain" href="' + base + 'devotional.html">Daily Devotional</a>' +
              '<a class="plain" href="' + base + 'affirmations.html">Daily Affirmations</a>' +
              '<a class="plain" href="' + base + 'warfare.html">Daily Warfare Prayers</a>' +
              '<a class="plain" href="' + base + 'testimonies.html">Testimonies</a>' +
            "</div></details>" +
            '<details class="tsacc"><summary>Worship</summary><div class="tsacc-body">' +
              '<a class="plain" href="' + base + 'radio.html">Worship Music</a>' +
            "</div></details>" +
            '<details class="tsacc"><summary>Free Resources</summary><div class="tsacc-body">' +
              '<a class="plain" href="' + base + 'scripture-resources.html">Bible Verses For Social Media</a>' +
              '<a class="plain" href="' + base + 'inspirational-graphics.html">Inspirational Social Media Posts</a>' +
            "</div></details>" +
            '<a class="tsdlink plain" href="' + base + 'prayer.html">Prayer Request</a>' +
            '<a class="tsdlink plain" href="' + base + 'about.html">About</a>' +
            '<a class="tsdlink plain" href="' + base + 'donate.html">Donate</a>' +
            '<a class="tsdlink plain tsdcart-count" href="' + base + 'cart.html">Cart (0)</a>' +
          "</div>" +
        "</div>";
      const ham = this.querySelector(".tshamburger");
      const drawer = this.querySelector(".tsdrawer");
      const openDrawer = () => { drawer.setAttribute("data-open", "1"); document.body.style.overflow = "hidden"; };
      const closeDrawer = () => { drawer.removeAttribute("data-open"); document.body.style.overflow = ""; };
      ham.addEventListener("click", openDrawer);
      this.querySelector(".tsdrawer-close").addEventListener("click", closeDrawer);
      this.querySelector(".tsdrawer-overlay").addEventListener("click", closeDrawer);
      const btn = this.querySelector(".tsbtn");
      const menu = this.querySelector(".tsmenu");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (menu.getAttribute("data-open")) menu.removeAttribute("data-open");
        else menu.setAttribute("data-open", "1");
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".tsnav-ts")) menu.removeAttribute("data-open");
      });
      this.querySelectorAll(".tsnav-db").forEach((wrap) => {
        const b = wrap.querySelector(".dbbtn");
        const m = wrap.querySelector(".dbmenu");
        if (!b || !m) return;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          this.querySelectorAll(".dbmenu").forEach((o) => { if (o !== m) o.removeAttribute("data-open"); });
          if (m.getAttribute("data-open")) m.removeAttribute("data-open");
          else m.setAttribute("data-open", "1");
        });
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".tsnav-db")) this.querySelectorAll(".dbmenu").forEach((m) => m.removeAttribute("data-open"));
      });
      this.addEventListener("mouseover", (e) => {
        const ci = e.target.closest(".catitem");
        if (!ci) return;
        const cat = ci.dataset.cat;
        const want = SUBS[cat] ? cat : "clothing-apparel";
        this.querySelectorAll(".catitem").forEach((a) => a.removeAttribute("data-on"));
        ci.setAttribute("data-on", "1");
        this.querySelectorAll(".megacols").forEach((p) => {
          p.style.display = p.dataset.for === want ? "grid" : "none";
        });
      });
    }
  }

  const SOCIAL = [
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 3c.3 2.2 1.7 3.9 3.9 4.2v2.6c-1.4 0-2.7-.4-3.9-1.1v5.7c0 3.2-2.6 5.6-5.7 5.2-2.6-.3-4.6-2.6-4.4-5.3.2-2.5 2.4-4.4 4.9-4.2v2.7c-1-.2-2 .5-2.2 1.5-.2 1 .5 2 1.5 2.1 1 .2 2-.5 2.1-1.5V3H16z"></path></svg>',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7c-.2-.9-.9-1.5-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4c-.8.2-1.5.8-1.7 1.7C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.9.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.8 1.7-1.7.4-1.5.4-4.7.4-4.7zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"></path></svg>',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2H17V3h-2.4C11.9 3 11 4.3 11 6.5v2H9V12h2v9h3v-9h2.3l.4-3.5H14z"></path></svg>',
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.9 6.6-1.7 8c-.1.6-.5.7-1 .4l-2.7-2-1.3 1.2c-.1.2-.3.3-.6.3l.2-2.8 5.1-4.6c.2-.2 0-.3-.3-.1L7.3 13l-2.7-.8c-.6-.2-.6-.6.1-.9l10.9-4.2c.5-.2 1 .1.8.9z"></path></svg>'
  ];

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      const base = this.getAttribute("base") || "";
      const HEART = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:3px"><path d="M12 20.5s-7.5-4.6-9.3-9C1.4 8.1 3.2 5 6.3 4.6c2-.3 3.7.7 4.7 2.2h2c1-1.5 2.7-2.5 4.7-2.2 3.1.4 4.9 3.5 3.6 6.9-1.8 4.4-9.3 9-9.3 9z"></path></svg>';
      const SCROLL = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:3px"><path d="M12 7.5v12"></path><path d="M12 7.5C10.4 6.2 8.2 5.5 5 5.5H2.5v12H5c3.2 0 5.4.7 7 2"></path><path d="M12 7.5c1.6-1.3 3.8-2 7-2h2.5v12H19c-3.2 0-5.4.7-7 2"></path></svg>';
      const CROSS = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:3px"><path d="M9.6 2.5h4.8v5.4H19.5v4.6h-5.1V21.5H9.6V12.5H4.5V7.9h5.1V2.5z"></path></svg>';
      const link = (href, label) => '<a class="plain" href="' + base + href + '" style="font-size:14px;color:#EDEAE4">' + label + "</a>";
      const bl = (icon) => (href, label) => '<a class="plain" href="' + base + href + '" style="display:flex;gap:8px;align-items:flex-start;font-size:14px;color:#EDEAE4">' + icon + '<span>' + label + '</span></a>';
      const hlink = bl(SCROLL), heartlink = bl(HEART), clink = bl(CROSS);
      const colh = (t) => '<div style="font-size:15px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#FFFFFF;margin-bottom:4px">' + t + '</div>';
      const col = (title, items) => '<div style="display:grid;gap:9px;align-content:start;min-width:0">' + colh(title) + items.join("") + '</div>';
      this.innerHTML =
        '<footer style="background:linear-gradient(135deg,#2E7AC4 0%,#17538F 28%,#0C3268 62%,#071E42 100%);color:#EDEAE4;padding:54px 34px 28px;font-family:\'Hanken Grotesk\',sans-serif">' +
          '<div style="max-width:1240px;margin:0 auto;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">' +
            '<div style="max-width:300px">' +
              '<a class="plain" href="' + base + 'index.html" style="display:flex;align-items:center;gap:10px"><span style="width:26px;height:26px;border-radius:50%;background:#41A5EE"></span><span style="font-weight:800;letter-spacing:-.4px;font-size:19px">Love &amp; Love YAH</span></a>' +
              '<p style="color:#FFFFFF;font-size:14px;line-height:1.6;margin:14px 0 18px">Love &amp; Love YAH is a Christ-centered ministry and shop. We make Holy Spirit inspired apparel and handmade goods that carries the Word into everyday life to help fulfill The Great Commission. 10% of every purchase is donated to a Christian ministry, mission, charity or non-profit. We also are grateful to provide FREE resources to help you grow closer to The Lord Jesus Christ (Yahushah Hamashiach). We give away everything we can for free, and we pray with anyone who asks &mdash; all to the Glory of God (Yahweh).</p>' +
              '<div style="display:flex;gap:10px">' + SOCIAL.map((s) => '<a href="#" style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.08);color:#EDEAE4">' + s + "</a>").join("") + "</div>" +
            "</div>" +
            '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:22px 6px;flex:1;min-width:520px">' +
              col("Clothing &amp; Accessories", [clink("christian-clothing-apparel.html","Clothing"), clink("christian-t-shirts.html","Shirts"), clink("christian-hoodies.html","Sweatshirts"), clink("christian-hats.html","Hats"), clink("christian-embroidery.html","Embroidery"), clink("mens-christian-clothing.html","Men&#39;s"), clink("womens-christian-clothing.html","Women&#39;s"), clink("christian-streetwear.html","Streetwear"), clink("christian-golf-apparel.html","Golf Wear"), clink("faith-based-clothing.html","Faith"), clink("christian-jewelry.html","Jewelry")]) +
              col("Household", [clink("christian-cups.html","Drinkware"), clink("christian-mugs.html","Mugs"), clink("christian-tumblers.html","Water Bottles")]) +
              col("Art &amp; Decor", [clink("christian-paintings.html","Art"), clink("christian-posters.html","Posters"), clink("christian-woodworking.html","Wood"), clink("christian-glasswork.html","Glass"), clink("christian-stickers.html","Stickers"), clink("christian-magnets.html","Magnets")]) +
              col("Daily Bread", [hlink("daily-verse.html","Daily Verse"), hlink("prophetic-word.html","Daily Prophetic Word"), hlink("devotional.html","Daily Devotional"), hlink("radio.html","Daily Worship"), hlink("affirmations.html","Daily Affirmations"), hlink("warfare.html","Daily Warfare Prayers")]) +
              col("Community", [heartlink("about.html","About Us"), heartlink("christian-merch.html","Merch"), heartlink("testimonies.html","Testimonies"), heartlink("scripture-resources.html","Social Media Posts"), heartlink("inspirational-graphics.html","Inspirational Posts"), heartlink("contact.html","Contact"), heartlink("give-back.html","Give Back"), heartlink("donate.html","Donation"), heartlink("prayer.html","Prayer Request")]) +
            "</div>" +
          "</div>" +
          '<div style="max-width:1180px;margin:34px auto 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;font-size:12px;color:#BBD8F5">' +
            "<span>© 2026 Love &amp; Love YAH. All rights reserved. <a class=\"plain\" href=\"https://www.crosstownseo.com/\" target=\"_blank\" rel=\"noopener\" style=\"color:#CFE3F8;text-decoration:underline\">Web Design, AEO, GEO, LLM done by CROSSTOWN SEO</a></span>" +
            '<span style="display:flex;gap:16px"><span>Privacy</span><span>Terms</span><span>Shipping &amp; Returns</span></span>' +
          "</div>" +
        "</footer>";
    }
  }

  customElements.define("site-nav", SiteNav);
  customElements.define("site-footer", SiteFooter);

  function refreshCartPills() {
    let n = 0;
    try { n = (JSON.parse(localStorage.getItem("llyCart")) || []).reduce((s, i) => s + i.qty, 0); } catch (e) {}
    document.querySelectorAll(".cartpill, .tsdcart-count").forEach((el) => { el.textContent = "Cart (" + n + ")"; });
  }
  document.addEventListener("DOMContentLoaded", refreshCartPills);
  document.addEventListener("cart:change", refreshCartPills);
  window.addEventListener("storage", (e) => { if (e.key === "llyCart") refreshCartPills(); });
})();
