/* Shared cart engine: localStorage-backed cart + small demo catalog for cross-sell. */
(function () {
  const KEY = "llyCart";

  const CATALOG = [
    { id: "wood-1", name: "Carved Wall Cross", price: 88, color: "#DCE6F4", category: "Woodworking", href: "woodworking.html" },
    { id: "wood-2", name: "Family Verse Sign", price: 140, color: "#E7E3DB", category: "Woodworking", href: "woodworking.html" },
    { id: "wood-3", name: "Walnut Prayer Box", price: 96, color: "#D6DFEA", category: "Woodworking", href: "woodworking.html" },
    { id: "wood-4", name: "Communion Tray", price: 180, color: "#DCE6F4", category: "Woodworking", href: "woodworking.html" },
    { id: "wood-5", name: "Live-Edge Shelf", price: 210, color: "#E7E3DB", category: "Woodworking", href: "woodworking.html" },
    { id: "wood-6", name: "Engraved Bible Stand", price: 120, color: "#D6DFEA", category: "Woodworking", href: "woodworking.html" },
    { id: "glass-1", name: "Stained Cross Panel", price: 320, color: "#DCE6F4", category: "Glasswork", href: "glasswork.html" },
    { id: "glass-2", name: "Dove Suncatcher", price: 78, color: "#E7E3DB", category: "Glasswork", href: "glasswork.html" },
    { id: "glass-3", name: "Fused Verse Tile", price: 110, color: "#D6DFEA", category: "Glasswork", href: "glasswork.html" },
    { id: "glass-4", name: "Chapel Window Study", price: 540, color: "#DCE6F4", category: "Glasswork", href: "glasswork.html" },
    { id: "glass-5", name: "Rose Window Round", price: 260, color: "#E7E3DB", category: "Glasswork", href: "glasswork.html" },
    { id: "glass-6", name: "Candle Lantern", price: 140, color: "#D6DFEA", category: "Glasswork", href: "glasswork.html" }
  ];

  const COUPONS = {
    "GIVE10": { pct: 10, label: "10% off" },
    "WELCOME5": { flat: 5, label: "$5 off" }
  };

  function getCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function saveCart(c) {
    localStorage.setItem(KEY, JSON.stringify(c));
    refreshCartUI();
    document.dispatchEvent(new CustomEvent("cart:change"));
  }
  function addToCart(item, qty) {
    qty = qty || 1;
    const c = getCart();
    const ex = c.find((i) => i.id === item.id);
    if (ex) ex.qty += qty;
    else c.push(Object.assign({}, item, { qty: qty }));
    saveCart(c);
  }
  function updateQty(id, qty) {
    const c = getCart();
    const it = c.find((i) => i.id === id);
    if (!it) return;
    if (qty <= 0) { removeItem(id); return; }
    it.qty = qty;
    saveCart(c);
  }
  function removeItem(id) {
    saveCart(getCart().filter((i) => i.id !== id));
  }
  function clearCart() { saveCart([]); }
  function cartCount() { return getCart().reduce((n, i) => n + i.qty, 0); }
  function cartSubtotal() { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }

  function applyCoupon(code) {
    const c = COUPONS[(code || "").trim().toUpperCase()];
    return c || null;
  }

  function refreshCartUI() {
    const n = cartCount();
    document.querySelectorAll(".cartpill, .tsdcart-count").forEach((el) => {
      el.textContent = "Cart (" + n + ")";
    });
  }

  window.LLYCart = {
    KEY, CATALOG, COUPONS,
    getCart, saveCart, addToCart, updateQty, removeItem, clearCart,
    cartCount, cartSubtotal, applyCoupon, refreshCartUI
  };

  document.addEventListener("DOMContentLoaded", refreshCartUI);
  window.addEventListener("storage", (e) => { if (e.key === KEY) refreshCartUI(); });
})();
