(function () {
  const STORAGE_KEY = "naqistore-cart-egp";

  const products = [
    {
      id: "ev-250",
      name: "Extra Virgin — 250 ml",
      desc: "A small bottle for trying the oil or light daily use.",
      price: 100,
      image:
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop&q=80",
    },
    {
      id: "ev-500",
      name: "Extra Virgin — 500 ml",
      desc: "First cold press, balanced fruit and pepper. Ideal for salads and finishing.",
      price: 200,
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80",
    },
    {
      id: "ev-750",
      name: "Extra Virgin — 750 ml",
      desc: "Our signature size—great for families who cook often.",
      price: 300,
      image:
        "https://images.unsplash.com/photo-1589985270826-45608737b5d0?w=400&h=400&fit=crop&q=80",
    },
    {
      id: "ev-1kg",
      name: "Extra Virgin — 1 kg",
      desc: "Best value for generous drizzling, roasting, and bread dipping.",
      price: 400,
      image:
        "https://images.unsplash.com/photo-1509352842000-1e7e207f35c2?w=400&h=400&fit=crop&q=80",
    },
  ];

  let cart = loadCart();

  const ORDER_EMAIL = "ziyad.abdeldaym@outlook.com";
  /** FormSubmit expects form-urlencoded data (not JSON). Use literal @ in path per their docs. */
  const FORMSUBMIT_AJAX = `https://formsubmit.co/ajax/${ORDER_EMAIL}`;

  let checkoutFormOpen = false;
  let checkoutSuccessOpen = false;

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
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
  }

  function buildOrderMessage(name, phone, address) {
    const lines = cart.map(
      (l) =>
        `• ${l.name} × ${l.qty}  →  ${formatMoney(lineTotal(l))}`
    );
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

  function resetCheckoutFormFields() {
    const name = document.getElementById("checkout-name");
    const phone = document.getElementById("checkout-phone");
    const address = document.getElementById("checkout-address");
    const err = document.getElementById("checkout-error");
    if (name) name.value = "";
    if (phone) phone.value = "";
    if (address) address.value = "";
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
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
        const phone = document.getElementById("checkout-phone")?.value.trim() || "";
        const address = document.getElementById("checkout-address")?.value.trim() || "";

        if (!name || !phone || !address) {
          if (errEl) {
            errEl.textContent = "Please fill in your name, phone, and address.";
            errEl.hidden = false;
          }
          return;
        }

        if (errEl) errEl.hidden = true;

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
              `Server returned ${res.status}.`;
          } else if (rejected) {
            sent = false;
            failDetail =
              (typeof data.message === "string" && data.message) ||
              "FormSubmit rejected the request.";
          } else if (accepted) {
            sent = true;
          } else {
            sent = false;
            failDetail =
              "Unexpected response from email service. If you opened this site as a file (double-click HTML), open it through a web server instead.";
          }
        } catch (err) {
          sent = false;
          failDetail = err && err.message ? String(err.message) : "Network error.";
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
              "Could not reach the email service. If you opened this page as a file (file://), use a local server or upload the site—otherwise browsers block the request.";
            errEl.innerHTML =
              escapeHtml(hint) +
              ' <a href="https://wa.me/201110438175" target="_blank" rel="noopener noreferrer">WhatsApp your order</a>.';
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
  }

  function removeLine(productId) {
    cart = cart.filter((l) => l.id !== productId);
    saveCart();
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

    const count = cart.reduce((s, l) => s + l.qty, 0);
    if (countEl) countEl.textContent = String(count);

    if (!listEl) {
      refreshCheckoutPanel();
      return;
    }

    if (cart.length === 0) {
      listEl.innerHTML =
        '<p class="cart-empty">Your cart is empty. Add a bottle to get started.</p>';
    } else {
      listEl.innerHTML = cart
        .map(
          (l) => `
        <div class="cart-line" data-id="${l.id}">
          <div>
            <div class="name">${escapeHtml(l.name)}</div>
            <div class="meta">${formatMoney(l.price)} × ${l.qty}</div>
            <button type="button" class="remove" data-remove="${escapeHtml(l.id)}">Remove</button>
          </div>
          <div>${formatMoney(lineTotal(l))}</div>
        </div>`
        )
        .join("");
      listEl.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => removeLine(btn.getAttribute("data-remove")));
      });
    }

    if (totalEl) totalEl.textContent = formatMoney(cartTotal());

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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  renderProducts();
  updateCartUI();
  setupCartDrawer();
  setupCheckout();
})();
