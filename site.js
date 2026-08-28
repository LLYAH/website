/* Shared page interactions: collection filters, testimony slider, players, chips. */
(function () {
  function setPlay(btn, on) {
    btn.dataset.on = on ? "1" : "0";
    btn.textContent = on ? "❚❚" : "▶";
  }

  function filter(cf, cat) {
    const acc = cf.dataset.acc, accfg = cf.dataset.accfg, ink = cf.dataset.ink;
    cf.querySelectorAll(".col-cat").forEach((b) => {
      const on = b.dataset.cat === cat;
      b.style.background = on ? acc : "transparent";
      b.style.color = on ? accfg : ink;
    });
    cf.querySelectorAll(".col-sec").forEach((s) => {
      s.style.display = cat === "all" || s.dataset.cat === cat ? "" : "none";
    });
  }

  function slide(i) {
    const t = document.querySelector(".tm-track");
    if (!t) return;
    const n = t.children.length;
    i = ((i % n) + n) % n;
    t.dataset.i = i;
    t.style.transform = "translateX(" + -i * 100 + "%)";
    const s = t.closest(".tm-slider");
    if (s) s.querySelectorAll(".tm-dot").forEach((d, k) => {
      d.style.background = k === i ? "#185ABD" : "rgba(0,0,0,.18)";
    });
  }

  document.addEventListener("click", (e) => {
    const cat = e.target.closest(".col-cat");
    if (cat) { const cf = cat.closest(".cf"); if (cf) filter(cf, cat.dataset.cat); return; }

    const arr = e.target.closest(".tm-arrow");
    if (arr) { const t = document.querySelector(".tm-track"); slide(parseInt((t && t.dataset.i) || "0", 10) + parseInt(arr.dataset.dir, 10)); return; }

    const dot = e.target.closest(".tm-dot");
    if (dot) { slide(parseInt(dot.dataset.k, 10)); return; }

    const rp = e.target.closest(".rd-play");
    if (rp) {
      const on = rp.dataset.on !== "1";
      document.querySelectorAll(".rd-play").forEach((b) => { if (b !== rp) setPlay(b, false); });
      setPlay(rp, on);
      document.querySelectorAll(".rd-eq span").forEach((s) => { s.style.animationPlayState = on ? "running" : "paused"; });
      return;
    }

    const bp = e.target.closest(".bv-play");
    if (bp) {
      const on = bp.dataset.on !== "1";
      document.querySelectorAll(".bv-play").forEach((b) => { if (b !== bp) setPlay(b, false); });
      setPlay(bp, on);
      return;
    }

    const pc = e.target.closest(".pr-cat");
    if (pc) {
      const on = pc.dataset.on !== "1";
      pc.dataset.on = on ? "1" : "0";
      pc.style.background = on ? "#185ABD" : "#fff";
      pc.style.color = on ? "#fff" : "#1A1917";
      pc.style.borderColor = on ? "#185ABD" : "rgba(0,0,0,.14)";
      return;
    }

    const plat = e.target.closest(".sr-plat");
    if (plat) {
      const NAMES = {
        all: ["all platforms", "Facebook 1200 × 630 • Facebook Reels 1080 × 1920 • Instagram 1080 × 1350 and 1080 × 1920 • Instagram Story 1080 × 1920 • X.com 1600 × 900 • TikTok 1080 × 1920 • YouTube 1280 × 720 and Shorts 1080 × 1920 • Truth Social 1200 × 675."],
        facebook: ["Facebook", "Facebook: 1200 × 630 feed images."],
        fbreels: ["Facebook Reels", "Facebook Reels: 1080 × 1920 full-screen video cover graphics."],
        instagram: ["Instagram", "Instagram: 1080 × 1350 feed posts and 1080 × 1920 stories and reels covers."],
        igstory: ["Instagram Story", "Instagram Story: 1080 × 1920 full-screen story graphics."],
        x: ["X.com", "X.com: 1600 × 900 in-stream images."],
        tiktok: ["TikTok", "TikTok: 1080 × 1920 full-screen graphics."],
        youtube: ["YouTube", "YouTube: 1280 × 720 thumbnails and 1080 × 1920 Shorts graphics."],
        truthsocial: ["Truth Social", "Truth Social: 1200 × 675 feed images."]
      };
      const key = plat.dataset.plat;
      plat.parentElement.querySelectorAll(".sr-plat").forEach((b) => {
        const on = b === plat;
        b.dataset.on = on ? "1" : "0";
        b.style.background = on ? "#185ABD" : "#fff";
        b.style.color = on ? "#fff" : "#1A1917";
        b.style.borderColor = on ? "#185ABD" : "rgba(0,0,0,.14)";
      });
      const label = (NAMES[key] || NAMES.all)[0];
      const w0 = document.querySelector(".srf");
      const sName = (w0 && w0.dataset.styleLabel) || "Bold";
      document.querySelectorAll(".sr-dl").forEach((b) => {
        b.textContent = b.classList.contains("sr-dl-all")
          ? "Download everything · " + label + " · " + sName
          : "Download " + label + " · " + sName;
      });
      const spec = document.querySelector(".sr-spec");
      if (spec) spec.textContent = (NAMES[key] || NAMES.all)[1];
      const wrap = document.querySelector(".srf");
      if (wrap) wrap.dataset.plat = key;
      return;
    }

    const sty = e.target.closest(".sr-style");
    if (sty) {
      const STYLES = {
        bold: ["Bold", "Bold: heavy condensed type, high contrast, solid color fields.", "#DCE6F4", "#7d8899"],
        modern: ["Modern", "Modern: clean sans type, wide margins, muted neutrals.", "#E7E3DB", "#7d8899"],
        urban: ["Urban", "Urban: spray texture, night backgrounds, hand-lettered accents.", "#2A2E36", "rgba(255,255,255,.6)"],
        elegant: ["Elegant", "Elegant: serif type, gold rules, soft cream backgrounds.", "#EFE7DC", "#9a8b76"]
      };
      const k = sty.dataset.style;
      const conf = STYLES[k] || STYLES.bold;
      sty.parentElement.querySelectorAll(".sr-style").forEach((b) => {
        const on = b === sty;
        b.dataset.on = on ? "1" : "0";
        b.style.background = on ? "#185ABD" : "#fff";
        b.style.color = on ? "#fff" : "#1A1917";
        b.style.borderColor = on ? "#185ABD" : "rgba(0,0,0,.14)";
      });
      const ss = document.querySelector(".sr-stylespec");
      if (ss) ss.textContent = conf[1];
      document.querySelectorAll(".sr-prev").forEach((p) => {
        p.style.background = conf[2];
        p.style.color = conf[3];
        p.textContent = conf[0].toLowerCase() + " style preview";
      });
      const w = document.querySelector(".srf");
      if (w) { w.dataset.style = k; w.dataset.styleLabel = conf[0]; }
      const cur = document.querySelector('.sr-plat[data-on="1"]');
      const platKey = (cur && cur.dataset.plat) || "all";
      const PL = { all: "all platforms", facebook: "Facebook", fbreels: "Facebook Reels", instagram: "Instagram", igstory: "Instagram Story", x: "X.com", tiktok: "TikTok", youtube: "YouTube", truthsocial: "Truth Social" };
      document.querySelectorAll(".sr-dl").forEach((b) => {
        b.textContent = b.classList.contains("sr-dl-all")
          ? "Download everything · " + PL[platKey] + " · " + conf[0]
          : "Download " + PL[platKey] + " · " + conf[0];
      });
      return;
    }

    const dvt = e.target.closest(".dv-tab");
    if (dvt) {
      const key = dvt.dataset.tab;
      dvt.parentElement.querySelectorAll(".dv-tab").forEach((b) => {
        const on = b === dvt;
        b.dataset.on = on ? "1" : "0";
        b.style.background = on ? "#185ABD" : "#fff";
        b.style.color = on ? "#fff" : "#1A1917";
        b.style.borderColor = on ? "#185ABD" : "rgba(0,0,0,.14)";
      });
      document.querySelectorAll(".dv-pane").forEach((p) => {
        p.style.display = p.dataset.pane === key ? "block" : "none";
      });
      const w = document.querySelector(".dvf");
      if (w) w.dataset.tab = key;
      return;
    }

    const chip = e.target.closest(".cat-chip");
    if (chip) {
      chip.parentElement.querySelectorAll(".cat-chip").forEach((b) => {
        b.dataset.on = "0"; b.style.background = "#fff"; b.style.color = "#1A1917"; b.style.borderColor = "rgba(0,0,0,.14)";
      });
      chip.dataset.on = "1"; chip.style.background = "#185ABD"; chip.style.color = "#fff"; chip.style.borderColor = "#185ABD";
      return;
    }

  });

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".cf").forEach((cf) => filter(cf, "all"));
    if (document.querySelector(".tm-track")) {
      setInterval(() => {
        if (document.hidden) return;
        const t = document.querySelector(".tm-track");
        if (t) slide(parseInt(t.dataset.i || "0", 10) + 1);
      }, 6500);
    }
  });
})();
