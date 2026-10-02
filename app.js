(function () {
  const config = window.NaqiConfig || {};
  const ORDER_EMAIL = config.FORMSUBMIT_EMAIL || "your-email@example.com";
  const WHATSAPP_NUMBER = config.WHATSAPP_NUMBER || "+201234567890";
  const WHATSAPP_LINK = `https://wa.me/${String(WHATSAPP_NUMBER).replace(/[^\d]/g, "")}`;
  const STORAGE_KEY = "naqistore-cart-egp";

  const products = [
    {
      id: "ev-250",
      name: "Extra Virgin — 250 ml",
      desc: "A small bottle for trying the oil or light daily use.",
      price: 200,
      image: "product-image.jpg",
    },
    {
      id: "ev-500",
      name: "Extra Virgin — 500 ml",
      desc: "First cold press, balanced fruit and pepper. Ideal for salads and finishing.",
      price: 350,
      image: "product-image.jpg",
    },
    {
      id: "ev-750",
      name: "Extra Virgin — 750 ml",
      desc: "Our signature size—great for families who cook often.",
      price: 500,
      image: "product-image.jpg",
    },
    {
      id: "ev-1kg",
      name: "Extra Virgin — 1 kg",
      desc: "Best value for generous drizzling, roasting, and bread dipping.",
      price: 600,
      image: "product-image.jpg",
    },
  ];

  let cart = loadCart();
  const FORMSUBMIT_AJAX = `https://formsubmit.co/ajax/${ORDER_EMAIL}`;
  let checkoutFormOpen = false;
  let checkoutSuccessOpen = false;

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && item.id && Number.isFinite(item.price) && Number.isFinite(item.qty))
        .map((item) => ({
          id: item.id,
          name: item.name || item.id,
          price: Number(item.price),
          qty: Math.max(1, Number(item.qty) || 1),
        }));
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function clearCart() {
    cart = [];
    saveCart();
    showToast("Cart cleared");
  }

  function showToast(message) {
    let toast = document.getElementById("naqi-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "naqi-toast";
      toast.style.cssText = "position:fixed;right:20px;bottom:20px;background:#1d3b2c;color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.2);font-size:14px;z-index:2000;opacity:0;transform:translateY(10px);transition:all .25s ease;max-width:260px;";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 1800);
  }

  function buildOrderMessage(name, phone, address) {
    const lines = cart.map((l) => `• ${l.name} × ${l.qty}  →  ${formatMoney(lineTotal(l))}`);
    const when = new Date().toLocaleString("en-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return [
      "New order from NaqiStore website",
      "",
      "Customer",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      "",
      "Items",
      ...lines,
      "",
      `Subtotal: ${formatMoney(cartTotal())}`,
      "",
      `Submitted: ${when}`,
    ].join("\n");
  }

  function refreshCheckoutPanel() {
    const flow = document.getElementById("checkout-flow");
    const stepStart = document.getElementById("checkout-step-start");
    const form = document.getElementById("checkout-form");
    const success = document.getElementById("checkout-success");
    if (!flow || !stepStart || !form || !success) return;

    if (checkoutSuccessOpen) {
      stepStart.hidden = true;
      form.hidden = true;
      success.hidden = false;
      flow.hidden = false;
      return;
    }

    success.hidden = true;

    const hasItems = cart.length > 0;
    if (!hasItems) {
      stepStart.hidden = true;
      form.hidden = true;
      checkoutFormOpen = false;
      flow.hidden = true;
      return;
    }

    flow.hidden = false;
    if (checkoutFormOpen) {
      stepStart.hidden = true;
      form.hidden = false;
    } else {
      stepStart.hidden = false;
      form.hidden = true;
    }
  }

  function clearCheckoutError() {
    const err = document.getElementById("checkout-error");
    if (!err) return;
    err.hidden = true;
    err.textContent = "";
  }

  function showCheckoutError(message) {
    const err = document.getElementById("checkout-error");
    if (!err) return;
    err.hidden = false;
    err.textContent = message;
  }

  function resetCheckoutFormFields() {
    const name = document.getElementById("checkout-name");
    const phone = document.getElementById("checkout-phone");
    const address = document.getElementById("checkout-address");
    clearCheckoutError();
    if (name) name.value = "";
    if (phone) phone.value = "";
    if (address) address.value = "";
  }

  function normalizePhone(value) {
    return String(value || "").replace(/[^\d+]/g, "").trim();
  }

  function isValidPhone(value) {
    const normalized = normalizePhone(value);
    return /^\+?\d{10,15}$/.test(normalized);
  }

  function setupCheckout() {
    const btnProceed = document.getElementById("checkout-btn");
    const form = document.getElementById("checkout-form");
    const btnCancel = document.getElementById("checkout-cancel");
    const btnSuccessClose = document.getElementById("checkout-success-close");
    const errEl = document.getElementById("checkout-error");

    if (btnProceed) {
      btnProceed.addEventListener("click", () => {
        if (cart.length === 0) return;
        checkoutFormOpen = true;
        clearCheckoutError();
        refreshCheckoutPanel();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener("click", () => {
        checkoutFormOpen = false;
        resetCheckoutFormFields();
        refreshCheckoutPanel();
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const name = document.getElementById("checkout-name")?.value.trim() || "";
        const phone = normalizePhone(document.getElementById("checkout-phone")?.value || "");
        const address = document.getElementById("checkout-address")?.value.trim() || "";

        if (!name || name.length < 2) {
          showCheckoutError("Please enter your full name.");
          return;
        }

        if (!isValidPhone(phone)) {
          showCheckoutError("Please enter a valid phone number (10–15 digits).");
          return;
        }

        if (!address || address.length < 8) {
          showCheckoutError("Please add a complete delivery address.");
          return;
        }

        clearCheckoutError();

        const message = buildOrderMessage(name, phone, address);
        const submitBtn = document.getElementById("submit-order");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }

        let sent = false;
        let failDetail = "";
        try {
          const params = new URLSearchParams();
          params.append("_subject", `NaqiStore order — ${name}`);
          params.append("name", name);
          params.append("phone", phone);
          params.append("address", address);
          params.append("message", message);
          params.append("_captcha", "false");

          const res = await fetch(FORMSUBMIT_AJAX, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: params.toString(),
          });

          const raw = await res.text();
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = {};
          }

          const rejected =
            data.success === false ||
            data.success === "false" ||
            Boolean(data.error);

          const accepted =
            data.success === true ||
            data.success === "true" ||
            data.message === "Email sent successfully!";

          if (!res.ok) {
            failDetail =
              (typeof data.message === "string" && data.message) ||
              `The email service returned ${res.status}.`;
          } else if (rejected) {
            sent = false;
            failDetail =
              (typeof data.message === "string" && data.message) ||
              "The email service rejected the request.";
          } else if (accepted) {
            sent = true;
          } else {
            sent = false;
            failDetail =
              "We could not confirm the order was sent. This can happen when the page is opened as a local file instead of through a web server.";
          }
        } catch (err) {
          sent = false;
          failDetail = err && err.message ? String(err.message) : "A network error occurred while sending the order.";
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send order";
        }

        if (!sent) {
          if (errEl) {
            errEl.hidden = false;
            const hint =
              failDetail ||
              "We could not send your order right now. Please try again in a moment.";
            errEl.innerHTML =
              `${escapeHtml(hint)} <a href="${WHATSAPP_LINK}" target="_blank" rel="noopener noreferrer">Send via WhatsApp</a>.`;
          }
          return;
        }

        checkoutSuccessOpen = true;
        checkoutFormOpen = false;
        resetCheckoutFormFields();
        clearCart();
        refreshCheckoutPanel();
      });
    }

    if (btnSuccessClose) {
      btnSuccessClose.addEventListener("click", () => {
        checkoutSuccessOpen = false;
        const drawer = document.getElementById("cart-drawer");
        const backdrop = document.getElementById("cart-backdrop");
        const openBtn = document.getElementById("open-cart");
        if (backdrop) backdrop.classList.remove("is-open");
        if (drawer) drawer.classList.remove("is-open");
        document.body.classList.remove("cart-open");
        if (openBtn) openBtn.setAttribute("aria-expanded", "false");
        refreshCheckoutPanel();
      });
    }
  }

  function formatMoney(n) {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  function addToCart(productId) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;

    checkoutSuccessOpen = false;
    const existing = cart.find((l) => l.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    }

    saveCart();
    showToast(`${p.name} added to cart`);
  }

  function changeQty(productId, delta) {
    const item = cart.find((l) => l.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((l) => l.id !== productId);
    }

    saveCart();
    if (item.qty <= 0) {
      showToast("Item removed from cart");
    }
  }

  function removeLine(productId) {
    const item = cart.find((l) => l.id === productId);
    cart = cart.filter((l) => l.id !== productId);
    saveCart();
    if (item) showToast(`${item.name} removed from cart`);
  }

  function lineTotal(line) {
    return line.price * line.qty;
  }

  function cartTotal() {
    return cart.reduce((sum, l) => sum + lineTotal(l), 0);
  }

  function updateCartUI() {
    const countEl = document.getElementById("cart-count");
    const listEl = document.getElementById("cart-list");
    const totalEl = document.getElementById("cart-total-amount");
    const clearBtn = document.getElementById("clear-cart");

    const count = cart.reduce((s, l) => s + l.qty, 0);
    if (countEl) countEl.textContent = String(count);

    if (!listEl) {
      refreshCheckoutPanel();
      return;
    }

    if (cart.length === 0) {
      listEl.innerHTML = `
        <div class="cart-empty-state">
          <p>Your cart is empty.</p>
          <p class="cart-empty-sub">Add a premium bottle to get started.</p>
          <button type="button" class="btn-primary cart-empty-btn" data-shop-link>Browse products</button>
        </div>
      `;
      const shopBtn = listEl.querySelector("[data-shop-link]");
      if (shopBtn) {
        shopBtn.addEventListener("click", () => {
          const drawer = document.getElementById("cart-drawer");
          const backdrop = document.getElementById("cart-backdrop");
          if (backdrop) backdrop.classList.remove("is-open");
          if (drawer) drawer.classList.remove("is-open");
          document.body.classList.remove("cart-open");
          document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } else {
      listEl.innerHTML = cart
        .map(
          (l) => `
          <div class="cart-line" data-id="${l.id}">
            <div>
              <div class="name">${escapeHtml(l.name)}</div>
              <div class="meta">${formatMoney(l.price)} each</div>
              <div class="qty-control" aria-label="Quantity controls">
                <button type="button" class="qty-btn" data-qty="decrease" data-id="${l.id}">−</button>
                <span class="qty-value">${l.qty}</span>
                <button type="button" class="qty-btn" data-qty="increase" data-id="${l.id}">+</button>
                <button type="button" class="remove" data-remove="${escapeHtml(l.id)}">Remove</button>
              </div>
            </div>
            <div>${formatMoney(lineTotal(l))}</div>
          </div>`
        )
        .join("");

      listEl.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => removeLine(btn.getAttribute("data-remove")));
      });

      listEl.querySelectorAll("[data-qty]").forEach((btn) => {
        const productId = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-qty");
        btn.addEventListener("click", () => {
          changeQty(productId, action === "increase" ? 1 : -1);
        });
      });
    }

    if (totalEl) totalEl.textContent = formatMoney(cartTotal());

    if (clearBtn) {
      clearBtn.disabled = cart.length === 0;
      clearBtn.style.opacity = cart.length === 0 ? "0.5" : "1";
    }

    refreshCheckoutPanel();
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    grid.innerHTML = products
      .map(
        (p) => `
        <article class="product-card">
          <div class="thumb">
            <img src="${p.image}" alt="" width="400" height="400" loading="lazy" />
          </div>
          <div class="body">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="desc">${escapeHtml(p.desc)}</p>
            <div class="row">
              <span class="price">${formatMoney(p.price)}</span>
              <button type="button" class="add" data-add="${escapeHtml(p.id)}">Add to cart</button>
            </div>
          </div>
        </article>`
      )
      .join("");

    grid.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add")));
    });
  }

  function setupCartDrawer() {
    const openBtn = document.getElementById("open-cart");
    const backdrop = document.getElementById("cart-backdrop");
    const drawer = document.getElementById("cart-drawer");
    const closeBtn = document.getElementById("close-cart");
    const clearBtn = document.getElementById("clear-cart");

    function open() {
      backdrop.classList.add("is-open");
      drawer.classList.add("is-open");
      document.body.classList.add("cart-open");
      if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    }

    function close() {
      backdrop.classList.remove("is-open");
      drawer.classList.remove("is-open");
      document.body.classList.remove("cart-open");
      if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    }

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);
    if (clearBtn) clearBtn.addEventListener("click", clearCart);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  renderProducts();
  updateCartUI();
  setupCartDrawer();
  setupCheckout();
})();
