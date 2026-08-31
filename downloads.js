/* LLYDownloads — resolves (set × platform × art style) to a real .zip the browser downloads.
 *
 * PRIMARY SOURCE: Vercel Blob, addressed by convention. Set CONFIG.blobBase to the public
 * blob base URL and upload zips at this exact path:
 *
 *     {blobBase}/{page}/{set}/{set}-{platform-slug}-{style}.zip
 *
 *   page          "scripture" | "inspirational"
 *   set           the data-set value on the card (see CATALOG below)
 *   platform-slug PLATFORMS[key].slug, e.g. "instagram-story-1080x1920"
 *   style         "bold" | "modern" | "urban" | "elegant"
 *
 *   e.g.  https://<id>.public.blob.vercel-storage.com/downloads/scripture/love/love-facebook-1200x630-bold.zip
 *
 * Nothing else needs editing when artwork is added — the button probes the URL, downloads it
 * if it exists, and shows "coming soon" if it does not. Availability is cached per page load.
 *
 * OVERRIDES: HOSTED["page/set/platform/style"] = url  pins one combination to an exact URL.
 * FALLBACK: with no blobBase configured, the browser builds the zip itself from loose PNGs.
 * Each set lists its filenames once in CATALOG; STYLE_DIR maps the four art styles to the
 * folders those same filenames live in (uploads/, uploads/modern/, uploads/urban/,
 * uploads/elegant/). Files not present in a style's folder are skipped, so the moment a
 * folder is populated that style starts producing zips with no code change.
 */
window.LLYDownloads = (function () {

  var CONFIG = {
    /* Public Vercel Blob base, no trailing slash. Leave "" to use the client-side builder. */
    blobBase: "",
    /* PRODUCTION SWITCH. Set true once the real zips are on Blob: the browser then serves
       only what actually exists there, and any combination whose zip is missing shows
       "coming soon" instead of quietly handing out a small sample zip built from uploads/. */
    blobOnly: false,
    /* Vercel Blob honours ?download=1 to force a save-as instead of opening in the tab. */
    forceDownloadParam: "download=1"
  };

  var PLATFORMS = {
    facebook:    { label: "Facebook",         w: 1200, h: 630,  slug: "facebook-1200x630" },
    fbreels:     { label: "Facebook Reels",   w: 1080, h: 1920, slug: "facebook-reels-1080x1920" },
    instagram:   { label: "Instagram",        w: 1080, h: 1350, slug: "instagram-1080x1350" },
    igstory:     { label: "Instagram Story",  w: 1080, h: 1920, slug: "instagram-story-1080x1920" },
    x:           { label: "X.com",            w: 1600, h: 900,  slug: "x-1600x900" },
    tiktok:      { label: "TikTok",           w: 1080, h: 1920, slug: "tiktok-1080x1920" },
    youtube:     { label: "YouTube",          w: 1280, h: 720,  slug: "youtube-1280x720" },
    truthsocial: { label: "Truth Social",     w: 1200, h: 675,  slug: "truth-social-1200x675" }
  };

  var STYLES = {
    bold:    { label: "Bold" },
    modern:  { label: "Modern" },
    urban:   { label: "Urban" },
    elegant: { label: "Elegant" }
  };

  /* Where each art style's source PNGs live. Same filenames in every folder. */
  var STYLE_DIR = {
    bold:    "uploads",
    modern:  "uploads/modern",
    urban:   "uploads/urban",
    elegant: "uploads/elegant"
  };

  /* Source artwork per page → set. One filename list per set, shared across all four styles;
     the style only decides which folder above the files are read from. */
  var CATALOG = {
    scripture: {
      "verse-a-day": { title: "A Verse a Day", files: [
        "006-proverbs-3-5.png", "001-john-3-16.png", "003-philippians-4-13.png",
        "017-john-14-6.png", "061-psalm-18-2.png", "267-genesis-1-27.png",
        "197-1-corinthians-6-19.png", "297-matthew-6-14.png", "231-2-timothy-4-7.png"
      ] },
      "love":        { title: "Verses on Love",            files: ["001-john-3-16.png"] },
      "strength":    { title: "Verses on Strength",        files: ["003-philippians-4-13.png"] },
      "jesus":       { title: "Verses on Jesus",           files: ["017-john-14-6.png"] },
      "deliverance": { title: "Verses on Deliverance",     files: ["061-psalm-18-2.png"] },
      "marriage":    { title: "Verses on Marriage",        files: ["267-genesis-1-27.png"] },
      "holy-spirit": { title: "Verses on the Holy Spirit", files: ["197-1-corinthians-6-19.png"] },
      "forgiveness": { title: "Verses on Forgiveness",     files: ["297-matthew-6-14.png"] },
      "faith":       { title: "Verses on Faith",           files: ["231-2-timothy-4-7.png"] }
    },
    inspirational: {
      "encouragement":   { title: "Encouragement for the Week", files: [] },
      "hope":            { title: "Hope and Comfort",           files: [] },
      "strength":        { title: "Strength and Courage",       files: [] },
      "identity":        { title: "Who You Are in Christ",      files: [] },
      "faith-over-fear": { title: "Faith Over Fear",            files: [] },
      "family":          { title: "Family and Home",            files: [] },
      "gratitude":       { title: "Gratitude and Praise",       files: [] }
    }
  };

  /* Full paths for one set in one style. */
  function sourceFiles(page, set, style) {
    var e = CATALOG[page] && CATALOG[page][set];
    if (!e || !e.files.length) return [];
    var dir = (STYLE_DIR[style] || STYLE_DIR.bold).replace(/\/$/, "");
    return e.files.map(function (f) { return dir + "/" + f; });
  }

  /* "page/set/platform/style" → exact url, overriding the blobBase convention. */
  var HOSTED = {};

  /* url → true/false, filled in by probe() so each combination is only checked once. */
  var PROBED = {};

  /* ---------- zip writer (stored, no compression) ---------- */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function makeZip(entries) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0, cdSize = 0;
    entries.forEach(function (e) {
      var name = enc.encode(e.name), crc = crc32(e.data), size = e.data.length;
      var lh = new Uint8Array(30 + name.length), dv = new DataView(lh.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true);
      dv.setUint32(14, crc, true); dv.setUint32(18, size, true); dv.setUint32(22, size, true);
      dv.setUint16(26, name.length, true);
      lh.set(name, 30);
      parts.push(lh, e.data);

      var ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, size, true); cv.setUint32(24, size, true);
      cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
      ch.set(name, 46);
      central.push(ch);
      offset += lh.length + size;
      cdSize += ch.length;
    });
    var eocd = new Uint8Array(22), ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [eocd]), { type: "application/zip" });
  }

  /* ---------- image resizing ---------- */
  function loadImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error("missing " + src)); };
      im.src = src;
    });
  }

  function edgeColor(im) {
    var c = document.createElement("canvas"); c.width = c.height = 1;
    var x = c.getContext("2d");
    x.drawImage(im, 0, 0, 1, 1);
    var d = x.getImageData(0, 0, 1, 1).data;
    return "rgb(" + d[0] + "," + d[1] + "," + d[2] + ")";
  }

  function renderTo(im, w, h) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var x = c.getContext("2d");
    x.fillStyle = edgeColor(im); x.fillRect(0, 0, w, h);
    var s = Math.min(w / im.width, h / im.height);
    var dw = Math.round(im.width * s), dh = Math.round(im.height * s);
    x.imageSmoothingQuality = "high";
    x.drawImage(im, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
    return new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/png"); });
  }

  function bytes(blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  /* ---------- public ---------- */
  function key(page, set, plat, style) { return page + "/" + set + "/" + plat + "/" + style; }

  function filename(page, set, plat, style) {
    return set + "-" + PLATFORMS[plat].slug + "-" + style + ".zip";
  }

  /* Where the zip should live on Vercel Blob, by convention. */
  function blobUrl(page, set, plat, style) {
    var pinned = HOSTED[key(page, set, plat, style)];
    if (pinned) return pinned;
    if (!CONFIG.blobBase) return null;
    return CONFIG.blobBase.replace(/\/$/, "") + "/" + page + "/" + set + "/" + filename(page, set, plat, style);
  }

  /* Resolves to the url if the zip really exists, else null. Cached per url. */
  function probe(url) {
    if (!url) return Promise.resolve(null);
    if (url in PROBED) return Promise.resolve(PROBED[url] ? url : null);
    return fetch(url, { method: "HEAD", mode: "cors" })
      .then(function (r) { PROBED[url] = r.ok; return r.ok ? url : null; })
      .catch(function () { PROBED[url] = false; return null; });
  }

  /* Local fallback: does the client-side builder have source art for this combination?
     Always false in blobOnly mode — Blob is the only source of truth in production. */
  function buildable(page, set, style) {
    if (CONFIG.blobOnly) return false;
    return sourceFiles(page, set, style).length > 0;
  }

  function available(page, set, plat, style) {
    return !!blobUrl(page, set, plat, style) || buildable(page, set, style);
  }

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  /* onProgress(done, total) */
  function build(page, set, plat, style, onProgress) {
    var entry = CATALOG[page] && CATALOG[page][set];
    var files = sourceFiles(page, set, style);
    if (!files.length) return Promise.reject(new Error("unavailable"));

    var p = PLATFORMS[plat], st = STYLES[style], out = [], i = 0;
    var folder = set + "-" + p.slug + "-" + style;

    function next() {
      if (i >= files.length) return Promise.resolve();
      var src = files[i];
      return loadImage(src)
        .then(function (im) { return renderTo(im, p.w, p.h); })
        .then(bytes)
        .then(function (u8) {
          out.push({ name: folder + "/" + src.split("/").pop(), data: u8 });
        })
        .catch(function () { /* that style's folder doesn't have this file yet — skip it */ })
        .then(function () {
          i++;
          if (onProgress) onProgress(i, files.length);
          return next();
        });
    }

    return next().then(function () {
      if (!out.length) throw new Error("unavailable");
      var enc = new TextEncoder();
      var list = out.map(function (o) { return "  " + o.name.split("/").pop(); }).join("\n");
      var readme =
        "Love & Love YAH — " + (entry.title || set) + "\n" +
        st.label + " art style · " + p.label + " · " + p.w + " x " + p.h + " px\n\n" +
        out.length + " PNG graphic" + (out.length === 1 ? "" : "s") + ", numbered so a scheduler keeps them in order.\n\n" +
        "Files\n" + list + "\n\n" +
        "License\nFree to post, print, and project. Please do not resell.\n" +
        "Credit is welcome but not required. To the glory of God (YAH).\n\n" +
        "loveandloveyah.com\n";
      out.push({ name: folder + "/README.txt", data: enc.encode(readme) });
      return { blob: makeZip(out), name: filename(page, set, plat, style), count: out.length - 1 };
    });
  }

  return {
    CONFIG: CONFIG, PLATFORMS: PLATFORMS, STYLES: STYLES,
    CATALOG: CATALOG, STYLE_DIR: STYLE_DIR, sourceFiles: sourceFiles, HOSTED: HOSTED,
    available: available, buildable: buildable, blobUrl: blobUrl, probe: probe,
    build: build, filename: filename, saveBlob: saveBlob
  };
})();

/* ---------- preview tiles follow the selected art style ---------- */
(function () {
  var D = window.LLYDownloads;

  function apply(style) {
    var dir = (D.STYLE_DIR[style] || D.STYLE_DIR.bold).replace(/\/$/, "");
    document.querySelectorAll(".sr-prev[data-file]").forEach(function (p) {
      var src = dir + "/" + p.dataset.file;
      var probe = new Image();
      probe.onload = function () { p.style.backgroundImage = "url('" + src + "')"; };
      probe.onerror = function () {
        /* that style's folder doesn't have this verse yet — keep the bold artwork showing */
        p.style.backgroundImage = "url('" + D.STYLE_DIR.bold.replace(/\/$/, "") + "/" + p.dataset.file + "')";
      };
      probe.src = src;
    });
  }

  document.addEventListener("click", function (e) {
    var s = e.target.closest(".sr-style");
    if (s) apply(s.dataset.style);
  });

  document.addEventListener("DOMContentLoaded", function () {
    var w = document.querySelector(".srf");
    apply((w && w.dataset.style) || "bold");
  });
})();

/* ---------- wire the download buttons ---------- */
(function () {
  var BLUE = "#41A5EE", DIM = "#B9C4CE";

  function ctx(btn) {
    var wrap = btn.closest(".srf");
    var card = btn.closest("[data-set]");
    return {
      page: (wrap && wrap.dataset.page) || "scripture",
      set: card && card.dataset.set,
      plat: (wrap && wrap.dataset.plat) || "facebook",
      style: (wrap && wrap.dataset.style) || "bold"
    };
  }

  function idleLabel(c) {
    var P = window.LLYDownloads.PLATFORMS[c.plat], S = window.LLYDownloads.STYLES[c.style];
    return "Download " + P.label + " · " + S.label;
  }

  function setState(btn, text, bg, disabled) {
    btn.textContent = text;
    btn.style.background = bg;
    btn.style.cursor = disabled ? "default" : "pointer";
    btn.disabled = !!disabled;
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".sr-dl");
    if (!btn || btn.dataset.busy === "1") return;
    var D = window.LLYDownloads;
    var c = ctx(btn);
    if (!c.set) return;

    function soon() {
      setState(btn, D.STYLES[c.style].label + " set is coming soon", DIM, true);
      setTimeout(function () { setState(btn, idleLabel(ctx(btn)), BLUE, false); }, 3500);
    }
    function done(text) {
      setState(btn, text, "#2E8B57", false);
      setTimeout(function () { setState(btn, idleLabel(ctx(btn)), BLUE, false); }, 4000);
    }

    btn.dataset.busy = "1";
    setState(btn, "Preparing zip…", "#185ABD", true);

    D.probe(D.blobUrl(c.page, c.set, c.plat, c.style)).then(function (url) {
      if (url) {
        var href = url + (url.indexOf("?") > -1 ? "&" : "?") + D.CONFIG.forceDownloadParam;
        var a = document.createElement("a");
        a.href = href;
        a.download = D.filename(c.page, c.set, c.plat, c.style);
        a.rel = "noopener";
        document.body.appendChild(a); a.click(); a.remove();
        btn.dataset.busy = "0";
        done("Downloaded ✓");
        return;
      }
      if (!D.buildable(c.page, c.set, c.style)) { btn.dataset.busy = "0"; soon(); return; }

      return D.build(c.page, c.set, c.plat, c.style, function (n, total) {
        setState(btn, "Preparing zip… " + Math.round((n / total) * 100) + "%", "#185ABD", true);
      }).then(function (r) {
        D.saveBlob(r.blob, r.name);
        btn.dataset.busy = "0";
        done("Downloaded ✓ " + r.count + (r.count === 1 ? " graphic" : " graphics"));
      });
    }).catch(function (err) {
      btn.dataset.busy = "0";
      /* No source art in that style's folder yet — not a failure, just unreleased. */
      if (err && err.message === "unavailable") { soon(); return; }
      setState(btn, "Download failed — try again", "#B4483F", false);
      setTimeout(function () { setState(btn, idleLabel(ctx(btn)), BLUE, false); }, 4000);
    });
  });
})();
