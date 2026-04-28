document.addEventListener("DOMContentLoaded", function () {
  const CART_STORAGE_KEY = "siteCartV1";
  const FREE_SHIPPING_THRESHOLD = 150;
  const SHIPPING_FEE = 20;

  initNavigation();
  initSearch();
  initHeroSlideshow();
  initCart();
  updateCartUI();

  function initNavigation() {
    const navLinks = document.getElementById("nav-links");
    const navOverlay = document.getElementById("nav-overlay");
    const navClose = document.getElementById("nav-close");
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");

    if (!navLinks || !navOverlay || !mobileMenuBtn) return;

    function openMenu() {
      navLinks.classList.add("active");
      navOverlay.classList.add("active");
      document.body.classList.add("nav-open");
    }

    function closeMenu() {
      navLinks.classList.remove("active");
      navOverlay.classList.remove("active");
      document.body.classList.remove("nav-open");
    }

    mobileMenuBtn.addEventListener("click", openMenu);
    navOverlay.addEventListener("click", closeMenu);
    if (navClose) navClose.addEventListener("click", closeMenu);

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  function initSearch() {
    const searchToggle = document.getElementById("search-toggle");
    const searchContainer = document.getElementById("search-container");
    const searchForm = document.querySelector(".search-form");
    const searchInput = document.getElementById("product-search");
    const suggestions = document.getElementById("search-suggestions");
    const productCount = document.getElementById("product-count");

    if (!searchContainer || !searchInput) return;

    const hiddenClass = "js-search-hidden";
    const style = document.createElement("style");
    style.textContent = `.${hiddenClass}{display:none !important;}`;
    document.head.appendChild(style);

    let debounceId = null;

    function getCards() {
      return Array.from(document.querySelectorAll(".product-card"));
    }

    function getCardText(card) {
      const parts = [
        card.dataset.title,
        card.dataset.description,
        card.dataset.tags,
        card.querySelector("h3")?.textContent,
        card.querySelector("p")?.textContent,
      ].filter(Boolean);

      // Fallback: if dataset/h3/p aren't present (or cards are built differently),
      // search the visible text so filtering still works.
      const fallbackText = card.textContent?.trim();
      if (fallbackText) parts.push(fallbackText);

      return parts.join(" ").replace(/\s+/g, " ").toLowerCase();
    }

    function renderSuggestions(matches) {
      if (!suggestions) return;
      suggestions.innerHTML = "";

      if (!matches.length) {
        suggestions.hidden = true;
        return;
      }

      matches.slice(0, 6).forEach((card) => {
        const title =
          card.querySelector("h3")?.textContent?.trim() || "Product";
        const description = card.querySelector("p")?.textContent?.trim() || "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-suggestion";
        button.setAttribute("role", "option");
        button.innerHTML = `<strong>${title}</strong>${description ? `<span>${description}</span>` : ""}`;
        button.addEventListener("click", () => {
          searchInput.value = title;
          applySearch(title);
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          closeSearch();
        });
        suggestions.appendChild(button);
      });

      suggestions.hidden = false;
    }

    function applySearch(value) {
      const term = value.trim().toLowerCase();
      const cards = getCards();
      const matches = [];

      cards.forEach((card) => {
        const matched = !term || getCardText(card).includes(term);
        card.classList.toggle(hiddenClass, !matched);
        if (matched) matches.push(card);
      });

      if (productCount) {
        const visibleCount = matches.length;
        const totalCount = cards.length;
        productCount.textContent = term
          ? visibleCount > 0
            ? `${visibleCount} of ${totalCount} products matched`
            : "No matching products"
          : totalCount > 0
            ? `${totalCount} products available`
            : "";
      }

      renderSuggestions(term ? matches : []);
    }

    function openSearch() {
      searchContainer.classList.add("active");
      searchInput.focus();
      applySearch(searchInput.value);
    }

    function closeSearch() {
      searchContainer.classList.remove("active");
      if (suggestions) suggestions.hidden = true;
    }

    if (searchToggle) {
      searchToggle.addEventListener("click", () => {
        if (searchContainer.classList.contains("active")) closeSearch();
        else openSearch();
      });
    }

    if (searchForm) {
      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        applySearch(searchInput.value);
        const firstVisible = getCards().find(
          (card) => !card.classList.contains(hiddenClass),
        );
        if (firstVisible) {
          firstVisible.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceId);
      debounceId = window.setTimeout(() => applySearch(searchInput.value), 120);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) applySearch(searchInput.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSearch();
    });

    document.addEventListener("click", (event) => {
      if (
        searchContainer.classList.contains("active") &&
        !searchContainer.contains(event.target) &&
        event.target !== searchToggle
      ) {
        closeSearch();
      }
    });

    applySearch(searchInput.value);
  }

  function initHeroSlideshow() {
    const hero = document.getElementById("hero-slideshow");
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dot"));
    const prevBtn = hero.querySelector(".hero-prev");
    const nextBtn = hero.querySelector(".hero-next");

    if (!slides.length) return;

    let currentSlide = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains("active")),
    );

    function showSlide(index) {
      currentSlide = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === currentSlide);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === currentSlide);
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.slide || 0);
        showSlide(index);
      });
    });

    if (prevBtn)
      prevBtn.addEventListener("click", () => showSlide(currentSlide - 1));
    if (nextBtn)
      nextBtn.addEventListener("click", () => showSlide(currentSlide + 1));

    window.setInterval(() => showSlide(currentSlide + 1), 6000);
  }

  function initCart() {
    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-overlay");
    const openCartBtn = document.getElementById("open-cart");
    const cartCloseBtn = document.getElementById("cart-close");
    const cartContinueBtn = document.getElementById("cart-continue");
    const cartCheckoutBtn = document.getElementById("cart-checkout");
    const cartItems = document.getElementById("cart-items");
    const miniItems = document.getElementById("mini-items");
    const cartCount = document.getElementById("cart-count");
    const cartSubtotal = document.getElementById("cart-subtotal");
    const cartShipping = document.getElementById("cart-shipping");
    const cartTotal = document.getElementById("cart-total");

    function readCart() {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (error) {
        return {};
      }
    }

    function writeCart(cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      renderCart();
    }

    function getCartItemsArray() {
      return Object.values(readCart());
    }

    function getNumber(value) {
      const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(numeric) ? numeric : 0;
    }

    function formatMoney(value) {
      return `₵${Number(value || 0).toFixed(2)}`;
    }

    function getCardPayload(card) {
      if (!card) return null;

      const title =
        card.dataset.title?.trim() ||
        card.querySelector("h3")?.textContent?.trim() ||
        "Product";
      const id =
        card.dataset.id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const priceText =
        card.querySelector(".price")?.textContent ||
        card.querySelector(".product-price")?.textContent ||
        "0";
      const image = card.querySelector("img")?.src || "";
      const description = card.querySelector("p")?.textContent?.trim() || "";

      return {
        id,
        title,
        price: getNumber(priceText),
        image,
        description,
        qty: 1,
      };
    }

    function addToCart(payload) {
      if (!payload) return;
      const cart = readCart();
      const existing = cart[payload.id];

      if (existing) {
        existing.qty = Number(existing.qty || 0) + 1;
      } else {
        cart[payload.id] = { ...payload, qty: 1 };
      }

      writeCart(cart);
      openCart();
    }

    function changeQuantity(id, delta) {
      const cart = readCart();
      if (!cart[id]) return;

      cart[id].qty = Number(cart[id].qty || 0) + delta;
      if (cart[id].qty <= 0) delete cart[id];
      writeCart(cart);
    }

    function removeItem(id) {
      const cart = readCart();
      delete cart[id];
      writeCart(cart);
    }

    function openCart() {
      if (!cartDrawer || !cartOverlay) return;
      cartDrawer.classList.add("open");
      cartOverlay.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
      cartOverlay.setAttribute("aria-hidden", "false");
      renderCart();
    }

    function closeCart() {
      if (!cartDrawer || !cartOverlay) return;
      cartDrawer.classList.remove("open");
      cartOverlay.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
      cartOverlay.setAttribute("aria-hidden", "true");
    }

    function renderCart() {
      const items = getCartItemsArray();
      const subtotal = items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0,
      );
      const shipping =
        subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
      const total = subtotal + shipping;

      if (cartCount) {
        const count = items.reduce(
          (sum, item) => sum + Number(item.qty || 0),
          0,
        );
        cartCount.textContent = String(count);
      }

      if (cartSubtotal) cartSubtotal.textContent = formatMoney(subtotal);
      if (cartShipping)
        cartShipping.textContent =
          shipping > 0 ? formatMoney(shipping) : "Free";
      if (cartTotal) cartTotal.textContent = formatMoney(total);

      if (miniItems) {
        miniItems.innerHTML = items.length
          ? items
              .slice(0, 3)
              .map(
                (item) => `
                  <div class="mini-item">
                    <strong>${item.title}</strong>
                    <span>${item.qty} × ${formatMoney(item.price)}</span>
                  </div>
                `,
              )
              .join("")
          : '<div class="mini-item empty">Your cart is empty</div>';
      }

      if (cartItems) {
        cartItems.innerHTML = items.length
          ? items
              .map(
                (item) => `
                  <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image" />
                    <div class="cart-item-details">
                      <strong>${item.title}</strong>
                      <span>${formatMoney(item.price)}</span>
                      <div class="cart-item-actions">
                        <button type="button" data-cart-action="decrease" data-id="${item.id}">−</button>
                        <span>${item.qty}</span>
                        <button type="button" data-cart-action="increase" data-id="${item.id}">+</button>
                        <button type="button" data-cart-action="remove" data-id="${item.id}">Remove</button>
                      </div>
                    </div>
                  </div>
                `,
              )
              .join("")
          : '<div class="empty-cart-message">Your cart is empty.</div>';
      }
    }

    if (openCartBtn) {
      openCartBtn.addEventListener("click", (event) => {
        event.preventDefault();
        openCart();
      });
    }

    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    if (cartContinueBtn) {
      cartContinueBtn.addEventListener("click", () => {
        closeCart();
      });
    }

    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener("click", () => {
        const items = getCartItemsArray();
        if (!items.length) {
          alert("Your cart is empty.");
          return;
        }
        window.location.href = "eboujewelry-checkout.html";
      });
    }

    document.addEventListener("click", (event) => {
      const addButton = event.target.closest(".add-to-cart");
      if (addButton) {
        const card = addButton.closest(".product-card");
        addToCart(getCardPayload(card));
        return;
      }

      const actionButton = event.target.closest("[data-cart-action]");
      if (!actionButton) return;

      const { cartAction, id } = actionButton.dataset;
      if (!id) return;

      if (cartAction === "increase") changeQuantity(id, 1);
      if (cartAction === "decrease") changeQuantity(id, -1);
      if (cartAction === "remove") removeItem(id);
    });

    window.addEventListener("storage", (event) => {
      if (event.key === CART_STORAGE_KEY) renderCart();
    });

    window.updateCartUI = renderCart;
  }

  function updateCartUI() {
    const count = document.getElementById("cart-count");
    if (count) {
      try {
        const cart = JSON.parse(localStorage.getItem("siteCartV1") || "{}");
        const totalItems = Object.values(cart).reduce(
          (sum, item) => sum + Number(item.qty || 0),
          0,
        );
        count.textContent = String(totalItems);
      } catch (error) {
        count.textContent = "0";
      }
    }

    if (typeof window.updateCartUI === "function") {
      window.updateCartUI();
    }
  }
});
