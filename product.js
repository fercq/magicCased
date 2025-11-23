(function initProductDetail() {
  const detailPage = document.querySelector(".product-page");
  if (!detailPage) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const detailContainer = document.querySelector(".product-detail");

  if (!productId) {
    renderNotFound();
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    renderNotFound();
    return;
  }

  const models = getProductModels(product) || [];
  const defaultModel = getDefaultModel(product, models);

  const mainImage = document.getElementById("mainImage");
  if (mainImage) {
    if (product.image) {
      mainImage.src = `assets/${product.image}`;
      mainImage.alt = product.imageAlt || product.name;
      mainImage.hidden = false;
    } else {
      mainImage.hidden = true;
    }
  }

  const tag = document.getElementById("productTag");
  if (tag) {
    if (product.tag) {
      tag.textContent = product.tag;
      tag.hidden = false;
    } else {
      tag.hidden = true;
    }
  }

  const nameEl = document.getElementById("productName");
  if (nameEl) nameEl.textContent = product.name;

  document.title = `${product.name} · ${STORE.name}`;

  const descriptionEl = document.getElementById("productDescription");
  if (descriptionEl) descriptionEl.textContent = product.description || "";

  const priceEl = document.getElementById("productPrice");
  if (priceEl) priceEl.textContent = money(product.price);

  const modelSelect = document.getElementById("productModel");
  if (modelSelect) {
    modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join("");
    modelSelect.value = defaultModel || (models[0] || "");
  }

  const qtyInput = document.getElementById("productQty");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const totalPriceEl = document.getElementById("totalPrice");

  const clampQty = value => {
    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) return 1;
    return Math.min(Math.max(numeric, 1), 99);
  };

  const updateTotal = () => {
    if (!qtyInput || !totalPriceEl) return;
    const qty = clampQty(qtyInput.value);
    qtyInput.value = qty;
    totalPriceEl.textContent = money(product.price * qty);
  };

  if (qtyInput) {
    qtyInput.value = clampQty(qtyInput.value);
    qtyInput.addEventListener("change", updateTotal);
  }

  if (qtyMinus && qtyInput) {
    qtyMinus.addEventListener("click", () => {
      qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) - 1);
      updateTotal();
    });
  }

  if (qtyPlus && qtyInput) {
    qtyPlus.addEventListener("click", () => {
      qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) + 1);
      updateTotal();
    });
  }

  const addBtn = document.getElementById("addToCartBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      if (!modelSelect) return;
      const selectedModel = modelSelect.value || defaultModel || (models[0] || "");
      if (!selectedModel) {
        modelSelect.focus();
        modelSelect.classList.add("input-error");
        setTimeout(() => modelSelect.classList.remove("input-error"), 1200);
        return;
      }
      const qty = qtyInput ? clampQty(qtyInput.value) : 1;
      addItemToCart(product.id, selectedModel, qty);
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener("change", () => {
      if (!modelSelect.value) {
        modelSelect.value = defaultModel || (models[0] || "");
      }
    });
  }

  updateTotal();

  function renderNotFound() {
    if (detailContainer) {
      detailContainer.innerHTML = `
        <div class="product-missing">
          <h1>Producto no encontrado</h1>
          <p class="muted">El artículo que buscas no existe o fue dado de baja.</p>
          <a class="btn-primary" href="index.html">Volver al catálogo</a>
        </div>
      `;
    }
    document.title = `Producto no encontrado · ${STORE.name}`;
  }
})();
