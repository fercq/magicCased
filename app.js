/* ====== Configurable ====== */
const STORE = {
  name: "MagicCased",
  currency: "MXN", // cambia si lo necesitas (p. ej. "EUR", "USD", "ARS", "COP", "CLP")
  locale: "es-MX",
  freeShippingMin: 600,
  whatsappNumber: "528443287544", // opcional: "5215555555555" (con país). Si está vacío, se abrirá WhatsApp sin destinatario.
};

/* Modelos disponibles globales */
const ALL_MODELS = [
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "IPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 17", "iPhone 17 Pro", "iPhone  17 Air", "iPhone 17 Pro Max", "Samsung S22", "Samsung S23", "Samsung S24", "Xiaomi 12", "Samsung A54", "Xiaomi 12"
];

// Modelo por defecto global — puede ser reemplazado por producto usando
// `defaultModel` en cada objeto de `PRODUCTS` o mediante el mapa
// `DEFAULT_PRODUCT_MODEL` abajo.
const DEFAULT_MODEL = "iPhone 17 Pro Max";

// Opcional: asignación por producto (id -> modelo). Útil para centralizar
// defaults sin editar cada entrada de PRODUCTS.
const DEFAULT_PRODUCT_MODEL = {};

/* Productos de ejemplo: reemplaza por los tuyos */
const PRODUCTS = [
  {
    id: "funda-transparente",
    name: "Funda Transparente",
    price: 24900, // centavos
    tag: "nuevo",
    models: { type: "ALL_EXCEPT", exclude: ["Xiaomi 12"] },
    description: "Ultraligera, antiamarillamiento y compatible con carga inalámbrica.",
    imageAlt: "Funda transparente para celular",
    image: "TransparentCase.png",
  },
  {
    id: "funda-antigolpes",
    name: "Funda Antigolpes",
    price: 34900,
    tag: "top ventas",
    models: "ALL",
    description: "Bordes reforzados y esquinas con absorción de impactos.",
    imageAlt: "Funda antigolpes con esquinas reforzadas",
    image: "black_iphone_case.png",
  },
  {
    id: "funda-biodegradable",
    name: "Funda Biodegradable",
    price: 39900,
    tag: "eco",
  models: "ALL",
    description: "Material a base de biopolímeros, acabado suave al tacto.",
    imageAlt: "Funda biodegradable color arena",
    image: "iphoneWhiteCase.png",
  },
  {
    id: "funda-marmol",
    name: "Funda Mármol",
    price: 29900,
    tag: "edición",
    models: "ALL",
    description: "Estampado mármol minimalista, resistente a rayones.",
    imageAlt: "Funda con patrón de mármol",
    image: "mirrorCase.png",
  },
  {
    id: "funda-matea",
    name: "Funda Mate Antihuellas",
    price: 28900,
    tag: "",
    models: "ALL",
    description: "Acabado mate premium que repele huellas y polvo.",
    imageAlt: "Funda mate negra",
    image: "techWovenCase.png",
  },
  {
    id: "funda-cuerda",
    name: "Funda con Cuerda",
    price: 36900,
    tag: "manos libres",
  models: "ALL",
    description: "Cordón ajustable para llevar al hombro o cruzada.",
    imageAlt: "Funda con cuerda ajustable",
    image: "orangeTechWovenCase.png",
  },
];

/* ====== Utilidades ====== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const fmt = new Intl.NumberFormat(STORE.locale, { style: "currency", currency: STORE.currency });
const money = cents => fmt.format(cents / 100);
const unique = arr => [...new Set(arr)];

/* ====== Estado ====== */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let filters = { q: "", model: "", sort: "pop" };

/* ====== Render ====== */

function getProductModels(p) {
  if (p.models === "ALL") return ALL_MODELS;
  if (typeof p.models === "object" && p.models.type === "ALL_EXCEPT") {
    return ALL_MODELS.filter(m => !p.models.exclude.includes(m));
  }
  return p.models;
}

function getDefaultModel(p, modelsOverride) {
  const models = modelsOverride || getProductModels(p) || [];
  const candidateDefaults = [p && p.defaultModel, DEFAULT_PRODUCT_MODEL[p.id], DEFAULT_MODEL];
  const chosen = candidateDefaults.find(d => d && models.includes(d));
  if (chosen) return chosen;
  return models.length ? models[0] : "";
}

function renderProducts() {
  const grid = $("#grid");
  if (!grid) return;
  const q = filters.q.trim().toLowerCase();
  let items = PRODUCTS.filter(p => {
    const models = getProductModels(p);
    const matchesQ = !q || [p.name, p.description, p.tag].join(" ").toLowerCase().includes(q);
    const matchesModel = !filters.model || models.includes(filters.model);
    return matchesQ && matchesModel;
  });
  // Ordenamiento según el select
  if (filters.sort === "priceAsc") {
    items.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "priceDesc") {
    items.sort((a, b) => b.price - a.price);
  } else if (filters.sort === "pop") {
    const score = p => (p.tag && p.tag.toLowerCase().includes('top ventas')) ? 2 : (p.tag ? 1 : 0);
    items.sort((a, b) => score(b) - score(a));
  }
  // Debug: print sort and resulting price order (se puede quitar luego)
  if (window && window.console) {
    console.log('[renderProducts] sort=', filters.sort, 'prices=', items.map(i => i.price));
  }
  grid.innerHTML = items.map(p => cardHTML(p)).join("");
  const emptyState = $("#emptyState");
  if (emptyState) emptyState.hidden = items.length > 0;

  // update sort label if present
  try {
    const labels = { pop: 'popular', priceAsc: 'precio: menor a mayor', priceDesc: 'precio: mayor a menor' };
    const node = $("#sortLabel");
    if (node) node.textContent = `Ordenado: ${labels[filters.sort] || filters.sort}`;
  } catch (err) { /* noop if DOM not ready */ }

  // add listeners
  $$("#grid .add").forEach(btn => btn.addEventListener("click", onAddToCart));
}

function cardHTML(p) {
  const models = getProductModels(p);
  const defaultModel = getDefaultModel(p, models);
  const detailUrl = `product.html?id=${encodeURIComponent(p.id)}`;
  return `
  <article class="card" data-id="${p.id}">
    <div class="thumb">
      ${p.tag ? `<span class="badge-tag">${p.tag}</span>` : ""}
      <a class="thumb-link" href="${detailUrl}">
        ${p.image ? `<img src="assets/${p.image}" alt="${p.imageAlt}" loading="lazy" decoding="async">` : ''}
      </a>
    </div>
    <div class="card-body">
      <h3><a class="card-link" href="${detailUrl}">${p.name}</a></h3>
      <p>${p.description}</p>
      <div class="meta">
        <span class="price">${money(p.price)}</span>
      </div>
      <div class="actions">
        ${modelSelectHTML(p, models, defaultModel)}
        <button class="btn add" data-id="${p.id}" aria-label="Añadir ${p.name}">
          <svg class="icon-cart" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45A1.99 1.99 0 0 0 10 19h10v-2H10.42a.25.25 0 0 1-.22-.37L11 14h6a2 2 0 0 0 1.8-1.1l3.58-7.16A1 1 0 0 0 21.5 4h-14.3l-.2-.4A2 2 0 0 0 5.2 3H2v2h2.2l3.1 6.2-.95 1.73A2 2 0 0 0 8 16h12v-2H8.76l.9-1.63L7 6z" fill="currentColor"/>
          </svg>
          <span class="add-label">Add</span>
        </button>
      </div>
      <a class="details-link" href="${detailUrl}" aria-label="Ver detalles de ${p.name}">Ver detalles →</a>
    </div>
  </article>`;
}

function modelSelectHTML(p, modelsOverride, defaultOverride) {
  const id = `m-${p.id}`;
  const models = modelsOverride || getProductModels(p);
  const chosen = defaultOverride ?? getDefaultModel(p, models);
  const options = models.map((m, idx) => `<option value="${m}" ${m === chosen ? 'selected' : (idx === 0 && !chosen ? 'selected' : '')}>${m}</option>`).join("");
  return `<select id="${id}" aria-label="Seleccionar modelo">${options}</select>`;
}

function renderCart() {
  const listEl = $("#cartList");
  if (listEl) {
    listEl.innerHTML = cart.length ? cart.map(item => cartItemHTML(item)).join("") : `<p class="muted">Tu carrito está vacío.</p>`;
  }
  const subtotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0);
  const subtotalEl = $("#cartSubtotal");
  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  const totalEl = $("#cartTotal");
  if (totalEl) totalEl.textContent = money(subtotal);
  const countEl = $("#cartCount");
  if (countEl) countEl.textContent = cart.reduce((acc, it) => acc + it.qty, 0);

  // eventos cantidad / remover
  if (listEl) {
    $$(".qty .inc", listEl).forEach(b => b.addEventListener("click", () => changeQty(b.dataset.id, +1)));
    $$(".qty .dec", listEl).forEach(b => b.addEventListener("click", () => changeQty(b.dataset.id, -1)));
    $$(".remove", listEl).forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.id)));
  }
}

function cartItemHTML(it) {
  return `
  <div class="cart-item">
    <div class="cart-thumb" aria-hidden="true"></div>
    <div>
      <h4>${it.name}</h4>
      <div class="muted" style="font-size:16px">Modelo: ${it.model}</div>
      <div class="muted" style="font-size:13px">${money(it.price)} c/u</div>
      <div class="qty" style="margin-top:6px">
        <button class="dec" data-id="${it.key}" aria-label="Disminuir cantidad">−</button>
        <span aria-live="polite">${it.qty}</span>
        <button class="inc" data-id="${it.key}" aria-label="Aumentar cantidad">+</button>
      </div>
    </div>
    <div style="text-align:right">
      <strong>${money(it.price * it.qty)}</strong><br/>
      <button class="link remove" data-id="${it.key}">Quitar</button>
    </div>
  </div>`;
}

/* ====== Acciones carrito ====== */
function onAddToCart(e) {
  const id = e.currentTarget.dataset.id;
  const p = PRODUCTS.find(x => x.id === id);
  const select = $(`#m-${id}`);
  const model = select ? select.value : getDefaultModel(p);
  addItemToCart(id, model, 1);
}

function changeQty(key, delta) {
  const it = cart.find(i => i.key === key);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) cart = cart.filter(x => x.key !== key);
  persist(); renderCart();
}

function removeFromCart(key) {
  cart = cart.filter(x => x.key !== key);
  persist(); renderCart();
}

function addItemToCart(id, model, qty = 1, options = {}) {
  if (!id || !model || qty <= 0) return null;
  const product = PRODUCTS.find(x => x.id === id);
  if (!product) return null;
  const key = `${id}-${model}`;
  const existing = cart.find(i => i.key === key);
  if (existing) existing.qty += qty;
  else cart.push({ key, id, name: product.name, model, price: product.price, qty });
  persist();
  renderCart();
  if (options.openDrawer !== false) {
    openDrawer(true);
  }
  return cart.find(i => i.key === key);
}

function persist() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ====== Drawer ====== */
const drawer = $("#drawer");
const openBtn = $("#openCart");
const closeBtn = $("#closeCart");
const backdrop = $("#drawerBackdrop");

function openDrawer(force) {
  if (!drawer) return;
  const show = force ?? drawer.getAttribute("aria-hidden") === "true";
  drawer.setAttribute("aria-hidden", show ? "false" : "true");
  if (show) {
    const focusTarget = $("#closeCart");
    if (focusTarget) focusTarget.focus();
  }
}
if (openBtn) openBtn.addEventListener("click", () => openDrawer(true));
if (closeBtn) closeBtn.addEventListener("click", () => openDrawer(false));
if (backdrop) backdrop.addEventListener("click", () => openDrawer(false));

/* ====== Checkout WhatsApp ====== */
const checkoutBtn = $("#checkout");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!cart.length) return;
    const lines = cart.map(it => `• ${it.name} (${it.model}) x${it.qty} — ${money(it.price * it.qty)}`);
    const total = cart.reduce((acc, it) => acc + it.price * it.qty, 0);
    const msg =
      `Hola, quiero hacer este pedido:\n${lines.join("\n")}\n\nTotal: ${money(total)}\n` +
      `Nombre:\nDirección de envío:\nMétodo de pago:\n`;
    const base = STORE.whatsappNumber ? `https://wa.me/${STORE.whatsappNumber}?text=` : `https://wa.me/?text=`;
    window.open(base + encodeURIComponent(msg), "_blank");
  });
}

const clearBtn = $("#clearCart");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (!cart.length) return;
    cart = [];
    persist();
    renderCart();
  });
}

/* ====== Filtros, orden, modelo ====== */
const searchInput = $("#q");
if (searchInput) searchInput.addEventListener("input", e => { filters.q = e.target.value; renderProducts(); });
const sortSelect = $("#sort");
if (sortSelect) sortSelect.addEventListener("change", e => { filters.sort = e.target.value; renderProducts(); });
const filterModel = $("#filterModel");
if (filterModel) filterModel.addEventListener("change", e => { filters.model = e.target.value; renderProducts(); });

/* Poblamos select de modelos basado en productos */
function populateModels() {
  const filter = $("#filterModel");
  if (!filter) return;
  filter.innerHTML = ['<option value="">Modelo (todos)</option>', ...ALL_MODELS.map(m => `<option value="${m}">${m}</option>`)].join("");
}

/* ====== Init ====== */
(function init() {
  const yearNode = $("#year");
  if (yearNode) yearNode.textContent = new Date().getFullYear();
  populateModels();
  renderProducts();
  renderCart();
  // “envío gratis” copy dinámico
  if (STORE.freeShippingMin) {
    const footer = document.querySelector(".site-footer small");
    if (footer) footer.innerHTML = footer.innerHTML.replace("$800", money(STORE.freeShippingMin));
  }
  // Link de WhatsApp en sección contacto con número si está configurado
  if (STORE.whatsappNumber) {
    const whats = $("#whatsappLink");
    if (whats) whats.href = `https://wa.me/${STORE.whatsappNumber}`;
  }
})();
