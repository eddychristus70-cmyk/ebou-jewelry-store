document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
    // Prevent header search form from submitting (we handle search client-side)
    const headerSearchForm = document.querySelector(
      ".search-container .search-form"
    );
    if (headerSearchForm) {
      headerSearchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const input = document.getElementById("product-search");
        if (input) input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }
  // Category tiles now link to categories.html anchors; adjust CTA text/icon
  document
    .querySelectorAll(".featured-categories .category-card")
    .forEach(function (card) {
      const ctaText = card.dataset.cta || "Shop this category";
      const useIcon = card.dataset.ctaIcon === "true";
      const ad = card.querySelector(".category-info .category-ad");
      if (!ad) return;
      ad.textContent = ctaText;
      if (useIcon && !ad.querySelector("i")) {
        const i = document.createElement("i");
        i.className = "fas fa-arrow-right";
        i.setAttribute("aria-hidden", "true");
        i.style.marginLeft = "8px";
        ad.appendChild(i);
      }
    });

  // Header search toggle: open/close the header search container and focus the input
  const searchToggle = document.getElementById("search-toggle");
  const searchContainer = document.getElementById("search-container");
  if (searchToggle && searchContainer) {
    searchToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const opened = searchContainer.classList.toggle("active");
      if (opened) {
        // small timeout to ensure visibility before focusing
        const input = document.getElementById("product-search");
        if (input)
          setTimeout(function () {
            input.focus();
          }, 10);
      }
    });

    // close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && searchContainer.classList.contains("active")) {
        searchContainer.classList.remove("active");
        searchToggle.focus();
      }
    });

    // click outside to close
    document.addEventListener("click", function (e) {
      if (
        !searchContainer.contains(e.target) &&
        !searchToggle.contains(e.target)
      ) {
        if (searchContainer.classList.contains("active"))
          searchContainer.classList.remove("active");
      }
    });
  }

  // Normalize price formatting inside product and preorder cards.
  // Ensures a single <span class="price">$X</span> before the Add to cart button.
  function normalizePriceContainer(containerSelector) {
    document.querySelectorAll(containerSelector).forEach(function (container) {
      // Try to find any element containing a numeric price
      let priceSource = container.querySelector(
        ".price, .new-price, div.price, span.new-price"
      );
      let priceText = priceSource
        ? priceSource.textContent.trim()
        : container.textContent.trim();

      // Extract first numeric value (with optional decimals)
      const match = priceText.match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (match) {
        // Use Ghana Cedi symbol (₵) for normalized inline prices
        const normalized = "₵" + match[1];

        // Remove existing price-like elements to avoid duplicates
        container.querySelectorAll(".price, .new-price").forEach(function (n) {
          n.remove();
        });

        // Create and insert normalized span.price before the button (if any)
        const span = document.createElement("span");
        span.className = "price";
        span.textContent = normalized;
        const btn = container.querySelector("button");
        if (btn) container.insertBefore(span, btn);
        else container.appendChild(span);
      }
    });
  }

  normalizePriceContainer(".product-price");
  normalizePriceContainer(".preorder-price");

  // Final safety pass: convert any remaining leading dollar signs inside
  // .price spans to the Ghana cedi symbol. This covers static HTML that
  // wasn't normalized earlier (many preorder blocks are repeated copies).
  document.querySelectorAll(".price").forEach(function (el) {
    if (el && typeof el.textContent === "string") {
      el.textContent = el.textContent.replace(/^\$\s?/, "₵");
    }
  });

  // Make product cards keyboard-accessible: add tabindex and role, and handle Enter/Space
  // Make product cards keyboard-accessible only when they don't contain other
  // interactive controls (buttons/links). If a card contains inner controls we
  // avoid making the container an interactive control to prevent nested
  // interactive controls.
  document.querySelectorAll(".product-card").forEach(function (card) {
    const hasInnerInteractive = !!card.querySelector(
      "a, button, input, select, textarea"
    );
    if (!hasInnerInteractive) {
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
      if (!card.hasAttribute("role")) card.setAttribute("role", "button");
      // mark that we made this card behave like a button so we can restore
      // tabindex when toggling visibility later
      card.dataset.wasInteractive = "true";
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.click();
        }
      });
    } else {
      // don't add role/tabindex to containers that host inner controls
      card.dataset.wasInteractive = "false";
    }
  });

  // Helper: make a card (and its descendants) inert when hidden. This ensures
  // aria-hidden elements do not contain focusable elements (accessibility
  // requirement). We save previous tabindex/disabled state in data attributes
  // so we can restore them when the element becomes visible again.
  function setCardInert(card, inert) {
    if (!card) return;
    const focusableSelector = "a, button, input, select, textarea, [tabindex]";
    const elems = Array.from(card.querySelectorAll(focusableSelector));
    elems.forEach((el) => {
      // skip the container itself
      if (el === card) return;
      if (inert) {
        if (el.hasAttribute("tabindex"))
          el.dataset.prevTabindex = el.getAttribute("tabindex");
        el.setAttribute("tabindex", "-1");
        if (
          el.tagName === "BUTTON" ||
          el.tagName === "INPUT" ||
          el.tagName === "SELECT" ||
          el.tagName === "TEXTAREA"
        ) {
          if (el.hasAttribute("disabled")) el.dataset.prevDisabled = "true";
          el.disabled = true;
        }
      } else {
        if (el.dataset.prevTabindex !== undefined) {
          el.setAttribute("tabindex", el.dataset.prevTabindex);
          delete el.dataset.prevTabindex;
        } else {
          // remove the temporary tabindex added earlier if it wasn't present
          if (el.getAttribute("tabindex") === "-1")
            el.removeAttribute("tabindex");
        }
        if (el.dataset.prevDisabled === "true") {
          el.disabled = true;
          delete el.dataset.prevDisabled;
        } else {
          // remove disabled if we set it previously and it wasn't originally disabled
          if (
            el.tagName === "BUTTON" ||
            el.tagName === "INPUT" ||
            el.tagName === "SELECT" ||
            el.tagName === "TEXTAREA"
          ) {
            el.removeAttribute("disabled");
          }
        }
      }
    });
  }

  // Navigate to product page when a product card is clicked (if it has a data-id).
  document.addEventListener("click", function (e) {
    // Ignore clicks on buttons/anchors so existing actions still work
    if (e.target.closest("button") || e.target.closest("a")) return;
    const card = e.target.closest(".product-card");
    if (!card) return;
    (async function () {
      let id = card.getAttribute("data-id");
      if (!id) {
        // try to resolve by matching image filename to products.json
        const img = card.querySelector("img");
        const imgName = img ? img.getAttribute("src").split("/").pop() : null;
        if (imgName) {
          try {
            const resp = await fetch("./products.json");
            if (resp.ok) {
              const products = await resp.json();
              const found = products.find(
                (p) => p.img && p.img.split("/").pop() === imgName
              );
              if (found) id = found.id;
            }
          } catch (err) {
            console.error("Error resolving product id by image", err);
          }
        }
      }

      if (id) {
        window.location.href = "product.html?id=" + encodeURIComponent(id);
      }
    })();
  });

  // Product filter: search-as-you-type with debounce and accessible count
  const searchInput = document.getElementById("product-search");
  const productCountEl = document.getElementById("product-count");
  const productCards = Array.from(document.querySelectorAll(".product-card"));
  // in-memory products list used for suggestions (filled from products.json)
  let productsIndex = [];
  let suggestionState = { index: -1 };

  // Config: control scroll/highlight behavior when search matches
  // 'single' = only scroll/highlight when there is exactly one visible match
  // 'always' = always scroll/highlight the first visible match
  // 'never' = disable automatic scroll/highlight
  const SEARCH_SCROLL_BEHAVIOR = "single";
  // If true, when the search yields exactly one visible product match we
  // navigate directly to the product page (helpful for quick lookups).
  const NAVIGATE_ON_SINGLE_MATCH = true;
  // store original title/desc for safe highlighting
  productCards.forEach(function (card) {
    const titleEl = card.querySelector(".product-info h3");
    const descEl = card.querySelector(".product-info p");
    if (titleEl && !card.dataset.origTitle)
      card.dataset.origTitle = titleEl.textContent.trim();
    if (descEl && !card.dataset.origDesc)
      card.dataset.origDesc = descEl.textContent.trim();
  });

  // Persist / restore search query in localStorage (tags removed)
  const STORAGE_QUERY_KEY = "productSearchQuery";

  function saveState() {
    try {
      if (searchInput)
        localStorage.setItem(STORAGE_QUERY_KEY, searchInput.value || "");
    } catch (e) {
      /* ignore storage errors */
    }
  }

  function loadState() {
    try {
      const q = localStorage.getItem(STORAGE_QUERY_KEY);
      if (searchInput && q !== null) searchInput.value = q;
      return [];
    } catch (e) {
      return [];
    }
  }

  // Utility: derive simple tags heuristically from product data
  function deriveTagsFromProduct(p) {
    const text = ((p.title || "") + " " + (p.description || "")).toLowerCase();
    const tokens = text.match(/[a-z0-9]+/g) || [];
    const stop = new Set([
      "and",
      "the",
      "for",
      "with",
      "a",
      "an",
      "of",
      "in",
      "includes",
      "set",
      "repurposed",
    ]);
    const tags = new Set();
    tokens.forEach((t) => {
      if (t.length <= 2) return;
      if (stop.has(t)) return;
      // numeric tokens are not useful
      if (/^[0-9]+$/.test(t)) return;
      tags.add(t);
    });
    // heuristic categories
    if (text.match(/wedding|bridal|bride|romantic|rose|petal/))
      tags.add("bridal");
    if (text.match(/luxury|gold|dior|designer|vintage/)) tags.add("luxury");
    if (text.match(/fashion|casual|everyday|cute|pretty/)) tags.add("casual");
    if (text.match(/men\b|mens|man/)) tags.add("men");
    if (text.match(/women\b|women's|women/)) tags.add("women");
    return Array.from(tags).slice(0, 12);
  }

  // Build tag list from products.json and sync data-tags on cards
  (async function syncTagsAndRender() {
    try {
      const resp = await fetch("./products.json");
      if (!resp.ok) return;
      const products = await resp.json();
      // keep a local copy for the suggestions/autocomplete
      productsIndex = Array.isArray(products) ? products : [];
      const tagSet = new Set();
      const idToTags = {};
      products.forEach((p) => {
        const tags = deriveTagsFromProduct(p);
        idToTags[p.id] = tags;
        tags.forEach((t) => tagSet.add(t));
      });

      // sync to DOM product cards
      productCards.forEach((card) => {
        const id = card.dataset.id;
        const existing = card.dataset.tags
          ? card.dataset.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        const fromJson = id && idToTags[id] ? idToTags[id] : [];
        const merged = Array.from(new Set(existing.concat(fromJson)));
        if (merged.length) card.dataset.tags = merged.join(",");
      });

      // Tag chips UI and facet counts have been removed per user request.
      // We still sync per-product tags from products.json into DOM datasets
      // above so other behaviors may use them, but no visual chips are rendered.
    } catch (err) {
      console.warn("Could not sync tags from products.json", err);
    }
  })();

  // --------------------------
  // Client-side product reviews
  // Persisted in localStorage under `siteReviewsV1`
  // Reviews shape: { productId: [{id, name, rating, text, createdAt}] }
  // --------------------------
  const REVIEWS_KEY = "siteReviewsV1";

  function loadReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveReviews(data) {
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Render average ratings on product cards (small star + count)
  function renderAverageRatings() {
    const reviews = loadReviews();
    document.querySelectorAll(".product-card").forEach((card) => {
      const id = card.dataset.id;
      if (!id) return;
      const list = reviews[id] || [];
      const avg = list.length
        ? list.reduce((s, r) => s + r.rating, 0) / list.length
        : 0;
      // show averaged stars in a small badge area
      let badge = card.querySelector(".avg-rating");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "avg-rating";
        badge.setAttribute("aria-hidden", "true");
        const info = card.querySelector(".product-info");
        if (info) info.insertBefore(badge, info.firstChild);
      }
      badge.innerHTML =
        renderStarsInline(avg) +
        (list.length ? ` <span class="avg-count">(${list.length})</span>` : "");
    });
  }

  function renderStarsInline(avg) {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5;
    const out = [];
    for (let i = 0; i < full; i++) out.push('<i class="fas fa-star"></i>');
    if (half) out.push('<i class="fas fa-star-half-alt"></i>');
    while (out.length < 5) out.push('<i class="far fa-star"></i>');
    return `<span class="stars-inline">${out.join("")}</span>`;
  }

  // Expose a small reviews widget on product pages when present
  (function wireProductReviewsWidget() {
    try {
      // If this is the product page, provide a review form and list
      const productTitle = document.getElementById("product-title");
      if (!productTitle) return;
      const qs = new URLSearchParams(location.search);
      const id = qs.get("id") || qs.get("slug");
      if (!id) return;
      const container = document.createElement("div");
      container.className = "product-reviews";
      container.innerHTML = `
        <h3>Reviews</h3>
        <div class="review-form">
          <label>Name<br/><input id="rv-name"/></label>
          <label>Rating<br/>
            <select id="rv-rating">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Terrible</option>
            </select>
          </label>
          <label>Review<br/><textarea id="rv-text" rows="3"></textarea></label>
          <div><button id="rv-submit" class="btn btn-primary">Submit review</button></div>
        </div>
        <div id="rv-list" class="rv-list"></div>
      `;
      const productInfo = document.querySelector(".product-single-info");
      if (productInfo) productInfo.appendChild(container);

      function refreshList() {
        const reviews = loadReviews();
        const list = reviews[id] || [];
        const el = document.getElementById("rv-list");
        if (!el) return;
        el.innerHTML = "";
        if (!list.length) {
          el.innerHTML =
            '<div class="no-reviews">Be the first to review this product.</div>';
          return;
        }
        list
          .slice()
          .reverse()
          .forEach((r) => {
            const row = document.createElement("div");
            row.className = "rv-item";
            row.innerHTML = `<div class="rv-meta"><strong>${escapeHtml(
              r.name || "Anonymous"
            )}</strong> — <span class="rv-rating">${renderStarsInline(
              r.rating
            )}</span> <span class="rv-date">${new Date(
              r.createdAt
            ).toLocaleDateString()}</span></div><div class="rv-text">${escapeHtml(
              r.text || ""
            )}</div>`;
            el.appendChild(row);
          });
      }

      document
        .getElementById("rv-submit")
        ?.addEventListener("click", function () {
          const name =
            (document.getElementById("rv-name")?.value || "").trim() ||
            "Anonymous";
          const rating =
            parseInt(document.getElementById("rv-rating")?.value || "5", 10) ||
            5;
          const text = (document.getElementById("rv-text")?.value || "").trim();
          const reviews = loadReviews();
          reviews[id] = reviews[id] || [];
          reviews[id].push({
            id: "r-" + Date.now(),
            name,
            rating,
            text,
            createdAt: new Date().toISOString(),
          });
          saveReviews(reviews);
          refreshList();
          renderAverageRatings();
          // clear form
          document.getElementById("rv-name").value = "";
          document.getElementById("rv-text").value = "";
        });

      refreshList();
      renderAverageRatings();
    } catch (e) {
      /* non-fatal */
    }
  })();

  // Suggestion rendering and keyboard navigation
  function buildSuggestionRows(query) {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    const out = [];
    if (!q) return out;
    // score products by simple heuristics: exact title startsWith, includes, tags
    const score = (p) => {
      const title = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const tags = (p.tags || "").toLowerCase();
      let s = 0;
      if (title.startsWith(q)) s += 100;
      if (title.indexOf(q) !== -1) s += 60;
      if (id.indexOf(q) !== -1) s += 40;
      if (desc.indexOf(q) !== -1) s += 30;
      if (tags.indexOf(q) !== -1) s += 20;
      // shorter titles slightly favored
      s += Math.max(0, 10 - (title.split(" ").length || 1));
      return s;
    };
    const candidates = productsIndex.slice();
    candidates.forEach((p) => (p._score = score(p)));
    candidates.sort((a, b) => (b._score || 0) - (a._score || 0));
    for (let i = 0, c = 0; i < candidates.length && c < 8; i++) {
      const p = candidates[i];
      if (!p || !p._score) continue;
      out.push(p);
      c++;
    }
    return out;
  }

  function renderSuggestions(query) {
    const container = document.getElementById("search-suggestions");
    if (!container) return;
    const rows = buildSuggestionRows(query);
    if (!rows || rows.length === 0) {
      container.innerHTML = "";
      container.hidden = true;
      suggestionState.index = -1;
      return;
    }
    const list = document.createElement("div");
    list.className = "suggestion-list";
    rows.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.setAttribute("role", "option");
      item.dataset.index = String(idx);
      item.dataset.id = p.id || "";
      // image
      const img = document.createElement("img");
      img.alt = p.title || "";
      img.src = p.img || p.image || "";
      img.loading = "lazy";
      // meta
      const meta = document.createElement("div");
      meta.className = "suggestion-meta";
      const title = document.createElement("div");
      title.className = "suggestion-title";
      title.textContent = p.title || p.id || "Product";
      const sub = document.createElement("div");
      sub.className = "suggestion-sub";
      sub.textContent = p.description ? String(p.description).slice(0, 60) : "";
      meta.appendChild(title);
      meta.appendChild(sub);
      const price = document.createElement("div");
      price.className = "suggestion-price";
      price.textContent = p.price ? String(p.price) : "";
      item.appendChild(img);
      item.appendChild(meta);
      item.appendChild(price);
      // click -> navigate
      item.addEventListener("mousedown", function (ev) {
        // use mousedown to prevent blur hiding before click
        ev.preventDefault();
        const id = this.dataset.id;
        if (id)
          window.location.href = "product.html?id=" + encodeURIComponent(id);
      });
      list.appendChild(item);
    });
    container.innerHTML = "";
    container.appendChild(list);
    container.hidden = false;
    suggestionState.index = -1;
  }

  // keyboard navigation for suggestions
  searchInput.addEventListener("keydown", function (e) {
    const container = document.getElementById("search-suggestions");
    if (!container || container.hidden) return;
    const items = Array.from(container.querySelectorAll(".suggestion-item"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggestionState.index = Math.min(
        items.length - 1,
        suggestionState.index + 1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggestionState.index = Math.max(0, suggestionState.index - 1);
    } else if (e.key === "Enter") {
      // if a suggestion is active, navigate to it
      if (suggestionState.index >= 0 && items[suggestionState.index]) {
        e.preventDefault();
        const id = items[suggestionState.index].dataset.id;
        if (id)
          window.location.href = "product.html?id=" + encodeURIComponent(id);
        return;
      }
    } else if (e.key === "Escape") {
      container.hidden = true;
      suggestionState.index = -1;
      return;
    } else {
      return; // don't run highlight logic for other keys
    }
    // update active class
    items.forEach((it, i) =>
      it.classList.toggle("active", i === suggestionState.index)
    );
    const active = items[suggestionState.index];
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  });

  // hide suggestions when clicking outside
  document.addEventListener("click", function (e) {
    const container = document.getElementById("search-suggestions");
    const sc = document.getElementById("search-container");
    if (!container) return;
    if (sc && !sc.contains(e.target)) {
      container.hidden = true;
      suggestionState.index = -1;
    }
  });
  if (searchInput) {
    let debounceTimeout = null;
    function updateCount() {
      const visible = productCards.filter(
        (c) => !c.classList.contains("product-hidden")
      ).length;
      const total = productCards.length;
      if (productCountEl) {
        if (visible === total) productCountEl.textContent = "";
        else
          productCountEl.textContent = `Showing ${visible} of ${total} products`;
      }
    }

    function filterProducts() {
      const q = searchInput.value.trim().toLowerCase();
      const qTokens = q.split(/\s+/).filter(Boolean);
      productCards.forEach(function (card) {
        const titleEl = card.querySelector(".product-info h3");
        const descEl = card.querySelector(".product-info p");
        const origTitle =
          card.dataset.origTitle || (titleEl ? titleEl.textContent.trim() : "");
        const origDesc =
          card.dataset.origDesc || (descEl ? descEl.textContent.trim() : "");
        const title = origTitle.toLowerCase();
        const desc = origDesc.toLowerCase();
        // include data-id, data-tags, and badge text in the searchable content
        const id = card.dataset.id ? String(card.dataset.id).toLowerCase() : "";
        const tags = card.dataset.tags
          ? String(card.dataset.tags).toLowerCase()
          : "";
        const badgeEl = card.querySelector(".product-badge");
        const badge = badgeEl ? badgeEl.textContent.trim().toLowerCase() : "";
        const combined = (
          title +
          " " +
          desc +
          " " +
          id +
          " " +
          tags +
          " " +
          badge
        ).trim();
        // match search query (all tokens must be present OR empty query)
        let match = false;
        if (qTokens.length === 0) match = true;
        else {
          match = qTokens.every((tok) => {
            if (!tok) return true;
            // direct substring match
            if (combined.indexOf(tok) !== -1) return true;
            // try simple singular/plural fallback (e.g. 'sets' vs 'set')
            if (tok.endsWith("s") && combined.indexOf(tok.slice(0, -1)) !== -1)
              return true;
            // try partial word startsWith to be more forgiving for partial input
            const words = combined.split(/\s+/);
            if (words.some((w) => w.indexOf(tok) === 0 || tok.indexOf(w) === 0))
              return true;
            return false;
          });
        }
        // tag-based filtering removed (no active tag UI)
        if (match) {
          card.classList.remove("product-hidden");
          card.setAttribute("aria-hidden", "false");
          // restore interactive state for children
          setCardInert(card, false);
          // restore tabindex only for cards we intentionally made interactive
          if (card.dataset.wasInteractive === "true")
            card.setAttribute("tabindex", "0");
          // restore original and highlight query tokens
          if (titleEl) titleEl.innerHTML = escapeHtml(origTitle);
          if (descEl) descEl.innerHTML = escapeHtml(origDesc);
          if (qTokens.length > 0) {
            // Highlight title and hide long descriptions to keep the search
            // area compact and focused on results.
            qTokens.forEach(function (tok) {
              if (!tok) return;
              highlightInElement(titleEl, tok);
            });
            if (descEl) descEl.style.display = "none";
          } else {
            if (descEl) descEl.style.display = "";
          }
        } else {
          card.classList.add("product-hidden");
          card.setAttribute("aria-hidden", "true");
          // make interactive descendants inert so aria-hidden elements don't
          // contain focusable elements
          setCardInert(card, true);
          if (card.dataset.wasInteractive === "true")
            card.setAttribute("tabindex", "-1");
        }
      });
      updateCount();
      // tag counts/facets removed — nothing to refresh here

      // If there is at least one visible result for a non-empty query,
      // bring the first visible product into view and give it a brief
      // highlight so the user can quickly find it.
      try {
        const visibleCards = productCards.filter(
          (c) => !c.classList.contains("product-hidden")
        );
        if (qTokens.length > 0 && visibleCards.length > 0) {
          // If configured, go straight to the product page when there's
          // exactly one visible match (fast path for precise searches)
          if (NAVIGATE_ON_SINGLE_MATCH && visibleCards.length === 1) {
            const only = visibleCards[0];
            const id = only.dataset.id;
            if (id) {
              // small delay so the user sees the result briefly, then navigate
              setTimeout(function () {
                window.location.href =
                  "product.html?id=" + encodeURIComponent(id);
              }, 220);
              return;
            }
          }
          // Determine whether to run the behavior based on config:
          // SEARCH_SCROLL_BEHAVIOR can be 'single', 'always', or 'never'
          const shouldRun =
            typeof SEARCH_SCROLL_BEHAVIOR !== "undefined" &&
            (SEARCH_SCROLL_BEHAVIOR === "always" ||
              (SEARCH_SCROLL_BEHAVIOR === "single" &&
                visibleCards.length === 1));
          if (shouldRun) {
            const first = visibleCards[0];
            // smooth scroll into center of viewport
            first.scrollIntoView({ behavior: "smooth", block: "center" });
            // prefer to focus the card if it's keyboard-interactive
            if (first.dataset.wasInteractive === "true") {
              first.focus({ preventScroll: true });
            } else {
              // otherwise toggle a temporary visual highlight
              first.classList.add("search-highlight");
              setTimeout(
                () => first.classList.remove("search-highlight"),
                1400
              );
            }
          }
        }
      } catch (e) {
        /* ignore scroll/focus errors in older browsers */
      }
    }

    // small helper to escape HTML when reinstating original text
    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // highlight token in element text (case-insensitive)
    function highlightInElement(el, token) {
      if (!el || !token) return;
      const re = new RegExp(
        "(" + token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
        "ig"
      );
      el.innerHTML = el.innerHTML.replace(
        re,
        '<span class="highlight">$1</span>'
      );
    }

    searchInput.addEventListener("input", function () {
      clearTimeout(debounceTimeout);
      const val = searchInput.value || "";
      debounceTimeout = setTimeout(function () {
        filterProducts();
        // render suggestions (autocomplete) using productsIndex
        try {
          if (val && val.trim().length >= 2) renderSuggestions(val);
          else {
            const c = document.getElementById("search-suggestions");
            if (c) {
              c.innerHTML = "";
              c.hidden = true;
            }
          }
        } catch (e) {
          /* ignore suggestion errors */
        }
      }, 180);
      saveState();
    });

    // initialize count
    // restore saved query (if any) and initialize count
    // loadState() returns saved tags (and sets searchInput.value as a side-effect)
    loadState();
    // If there's a restored query value, trigger an immediate filter.
    if (searchInput && searchInput.value && searchInput.value.trim() !== "") {
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      updateCount();
    }
  }

  // --- Simple client-side cart implementation ---
  const CART_KEY = "siteCartV1";
  const CART_STATUS_KEY = "siteCartStatus";
  let cart = {}; // id -> {id, title, price, img, qty}

  function consumeCartStatusFlag(reason) {
    const raw = localStorage.getItem(CART_STATUS_KEY);
    if (!raw) return false;
    let info = null;
    try {
      info = JSON.parse(raw);
    } catch (err) {
      console.warn("Invalid cart status flag, clearing it", err);
      localStorage.removeItem(CART_STATUS_KEY);
      return false;
    }
    const clearedAt = Number(info?.clearedAt || 0);
    const maxAgeMs = 5 * 60 * 1000; // trust flag for 5 minutes
    if (!clearedAt || Date.now() - clearedAt > maxAgeMs) {
      localStorage.removeItem(CART_STATUS_KEY);
      return false;
    }
    console.log("Cart status flag detected (" + reason + ")");
    localStorage.removeItem(CART_STATUS_KEY);
    localStorage.removeItem(CART_KEY);
    return true;
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      cart = raw ? JSON.parse(raw) : {};
      console.log(
        "Cart loaded:",
        cart,
        "Item count:",
        Object.keys(cart).length
      );
    } catch (e) {
      cart = {};
      console.log("Cart load error, reset to empty:", e);
    }
    updateCartCount();
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
    updateCartCount();
  }

  function updateCartCount() {
    const countEl = document.querySelector(".cart-count");
    const qty = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
    console.log("Updating cart count to:", qty);
    if (countEl) countEl.textContent = String(qty);
  }

  function addToCartById(id, qty = 1) {
    if (!id) return;
    // try to pull product info from productsIndex or visible card
    let p = productsIndex.find((x) => x.id === id) || null;
    if (!p) {
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) {
        p = {
          id: id,
          title:
            card.querySelector(".product-info h3")?.textContent?.trim() || id,
          price: card.querySelector(".price")?.textContent?.trim() || "",
          img:
            card.querySelector(".product-img img")?.getAttribute("src") || "",
        };
      }
    }
    if (!p) {
      console.warn("Product not found for cart:", id);
      return;
    }
    // determine numeric price and a formatted price string
    const priceNum = parsePrice(p.price || p.price_text || "") || 0;
    const priceLabel = formatCurrency(priceNum);
    if (!cart[id])
      cart[id] = {
        id: p.id,
        title: p.title || "",
        price: priceLabel,
        priceNumber: priceNum,
        img: p.img || p.image || p.img || "",
        qty: 0,
      };
    cart[id].qty = (cart[id].qty || 0) + qty;
    // remember last added for potential undo
    try {
      lastAdded = { id: id, qty: qty, title: p.title || id };
    } catch (e) {
      lastAdded = { id: id, qty: qty };
    }
    saveCart();
    renderCart();
    try {
      showToast((p.title || id) + " added to cart", function undo() {
        if (!lastAdded) return;
        changeQty(lastAdded.id, -lastAdded.qty);
        lastAdded = null;
      });
    } catch (e) {}
  }

  function removeFromCart(id) {
    if (!cart[id]) return;
    delete cart[id];
    saveCart();
    renderCart();
  }

  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty = Math.max(0, (cart[id].qty || 0) + delta);
    if (cart[id].qty === 0) delete cart[id];
    saveCart();
    renderCart();
  }

  // parse a price string ("$12.34" or "12.34") to a number
  function parsePrice(raw) {
    if (raw === undefined || raw === null) return 0;
    if (typeof raw === "number") return raw;
    const s = String(raw).replace(/,/g, "");
    const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  // format number as currency using the user's locale (fallback to en-US)
  function formatCurrency(n) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "GHS",
        currencyDisplay: "symbol",
        minimumFractionDigits: 2,
      }).format(Number(n || 0));
    } catch (e) {
      return "₵" + Number(n || 0).toFixed(2);
    }
  }

  function formatPrice(raw) {
    const n = parsePrice(raw);
    return formatCurrency(n);
  }

  // render cart drawer (Jumia-style rows + summary)
  function renderCart() {
    const container = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");
    const shippingEl = document.getElementById("cart-shipping");
    if (!container) return;
    container.innerHTML = "";
    const items = Object.values(cart || {});
    let subtotal = 0;
    if (!items.length) {
      // show a centered cart icon + message and CTA when the drawer is empty, hide totals
      container.innerHTML =
        '\n        <div class="drawer-empty" aria-hidden="true">\n          <i class="fas fa-shopping-cart"></i>\n          <div class="drawer-empty-text">No items yet</div>\n          <a class="empty-cta" href="#featured-products">Start shopping</a>\n        </div>\n      ';
      if (subtotalEl) subtotalEl.textContent = "";
      if (totalEl) totalEl.textContent = "";
      if (shippingEl) shippingEl.textContent = "";
      updateCartCount();
      try {
        renderMiniCart();
      } catch (e) {}
      return;
    }
    items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const img = document.createElement("img");
      img.src = it.img || "";
      img.alt = it.title || "";

      const meta = document.createElement("div");
      meta.className = "meta";
      const t = document.createElement("div");
      t.className = "title";
      t.textContent = it.title || it.id;
      const opts = document.createElement("div");
      opts.className = "opts";
      opts.textContent = it.options ? String(it.options) : "";
      meta.appendChild(t);
      meta.appendChild(opts);

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.flexDirection = "column";
      right.style.alignItems = "flex-end";
      right.style.gap = "8px";

      const unit = document.createElement("div");
      unit.className = "unit";
      const unitPrice =
        typeof it.priceNumber === "number"
          ? it.priceNumber
          : parsePrice(it.price || it.priceNumber || 0);
      unit.textContent = formatCurrency(unitPrice);

      const line = document.createElement("div");
      line.className = "line";
      line.textContent = formatCurrency(unitPrice * (it.qty || 0));

      const qtyCtl = document.createElement("div");
      qtyCtl.className = "qty-controls";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.className = "btn";
      minus.textContent = "-";
      minus.addEventListener("click", () => changeQty(it.id, -1));
      const qty = document.createElement("span");
      qty.textContent = String(it.qty || 0);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.className = "btn";
      plus.textContent = "+";
      plus.addEventListener("click", () => changeQty(it.id, +1));
      const rem = document.createElement("button");
      rem.type = "button";
      rem.className = "btn btn-outline cart-remove-btn";
      rem.textContent = "Remove";
      rem.addEventListener("click", () => removeFromCart(it.id));
      qtyCtl.appendChild(minus);
      qtyCtl.appendChild(qty);
      qtyCtl.appendChild(plus);

      const qtyActions = document.createElement("div");
      qtyActions.className = "qty-actions";
      qtyActions.appendChild(qtyCtl);
      qtyActions.appendChild(rem);

      right.appendChild(unit);
      right.appendChild(qtyActions);
      right.appendChild(line);

      row.appendChild(img);
      row.appendChild(meta);
      row.appendChild(right);
      container.appendChild(row);

      const priceNum =
        typeof it.priceNumber === "number"
          ? it.priceNumber
          : parsePrice(it.price || 0);
      subtotal += priceNum * (it.qty || 0);
    });

    const shipping = 0; // placeholder (could be dynamic based on rules)
    const total = subtotal + shipping;
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (shippingEl)
      shippingEl.textContent =
        shipping === 0 ? "Free" : formatCurrency(shipping);
    updateCartCount();
    try {
      renderMiniCart();
    } catch (e) {}
  }

  // --- Mini-cart rendering & show/hide ---
  function renderMiniCart() {
    const miniItems = document.getElementById("mini-items");
    const mini = document.getElementById("mini-cart");
    if (!miniItems) return;
    miniItems.innerHTML = "";
    const items = Object.values(cart || {});
    if (!items.length) {
      miniItems.innerHTML =
        '\n        <div class="mini-empty-icon" aria-hidden="true">\n          <i class="fas fa-shopping-cart"></i>\n        </div>\n        <div class="mini-empty-text">No items yet</div>\n        <div class="mini-empty-cta"><a href="#featured-products" class="mini-start">Start shopping</a></div>\n      ';
      // hide mini subtotal when empty
      const miniSubtotalEl = document.getElementById("mini-subtotal");
      if (miniSubtotalEl) miniSubtotalEl.textContent = "";
      if (mini) {
        mini.classList.remove("visible");
        mini.setAttribute("aria-hidden", "true");
      }
      return;
    }
    // show up to last 4 items (most recently added are last due to key insertion order)
    const toShow = items.slice(-4).reverse();
    let subtotal = 0;
    toShow.forEach((it) => {
      const row = document.createElement("div");
      row.className = "mini-item";
      const img = document.createElement("img");
      img.src = it.img || "";
      img.alt = it.title || "";
      const meta = document.createElement("div");
      meta.className = "mini-meta";
      const t = document.createElement("div");
      t.className = "mini-title";
      t.textContent = it.title || it.id;

      const controls = document.createElement("div");
      controls.className = "mini-controls";
      const mBtn = document.createElement("button");
      mBtn.type = "button";
      mBtn.className = "btn";
      mBtn.textContent = "-";
      mBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        changeQty(it.id, -1);
      });
      const qty = document.createElement("span");
      qty.textContent = String(it.qty || 0);
      const pBtn = document.createElement("button");
      pBtn.type = "button";
      pBtn.className = "btn";
      pBtn.textContent = "+";
      pBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        changeQty(it.id, +1);
      });
      const rem = document.createElement("button");
      rem.type = "button";
      rem.className = "remove";
      rem.textContent = "×";
      rem.addEventListener("click", function (e) {
        e.stopPropagation();
        removeFromCart(it.id);
      });
      controls.appendChild(mBtn);
      controls.appendChild(qty);
      controls.appendChild(pBtn);
      controls.appendChild(rem);

      meta.appendChild(t);
      row.appendChild(img);
      row.appendChild(meta);
      row.appendChild(controls);
      miniItems.appendChild(row);
      const priceNum =
        typeof it.priceNumber === "number"
          ? it.priceNumber
          : parsePrice(it.price || 0);
      subtotal += priceNum * (it.qty || 0);
    });
    const miniSubtotalEl2 = document.getElementById("mini-subtotal");
    if (miniSubtotalEl2)
      miniSubtotalEl2.textContent = "Subtotal: " + formatCurrency(subtotal);
    // Keep aria-hidden in sync with visibility. We should not force the
    // mini-cart to become visible (so callers decide to show it).
    if (mini) {
      if (mini.classList.contains("visible"))
        mini.setAttribute("aria-hidden", "false");
      else mini.setAttribute("aria-hidden", "true");
    }
  }

  function showMiniCart() {
    const mini = document.getElementById("mini-cart");
    if (!mini) return;
    mini.classList.add("visible");
    mini.setAttribute("aria-hidden", "false");
  }

  function hideMiniCart() {
    const mini = document.getElementById("mini-cart");
    if (!mini) return;
    mini.classList.remove("visible");
    mini.setAttribute("aria-hidden", "true");
  }

  // wire mini-cart events: only enable hover-based auto-open on devices
  // that support hover. On touch devices we keep the mini-cart hidden so
  // it doesn't auto-open and shift layout; users can open the full drawer
  // via the cart icon button.
  (function wireMiniCartEvents() {
    const cartWrap = document.getElementById("cart-icon");
    const openBtn = document.getElementById("open-cart");
    const mini = document.getElementById("mini-cart");
    if (!cartWrap || !mini) return;
    const supportsHover =
      window.matchMedia && window.matchMedia("(hover: hover)").matches;
    let hideTimer = null;

    if (supportsHover) {
      // desktop / laptop behavior: show on hover and focus
      cartWrap.addEventListener("mouseenter", function () {
        try {
          renderMiniCart();
        } catch (e) {}
        clearTimeout(hideTimer);
        showMiniCart();
      });
      cartWrap.addEventListener("mouseleave", function () {
        hideTimer = setTimeout(hideMiniCart, 320);
      });
      mini.addEventListener("mouseenter", function () {
        clearTimeout(hideTimer);
        showMiniCart();
      });
      mini.addEventListener("mouseleave", function () {
        hideTimer = setTimeout(hideMiniCart, 240);
      });
      // keyboard: show on focus, hide on blur
      if (openBtn) {
        openBtn.addEventListener("focus", function () {
          try {
            renderMiniCart();
          } catch (e) {}
          showMiniCart();
        });
        openBtn.addEventListener("blur", function () {
          hideTimer = setTimeout(hideMiniCart, 240);
        });
      }
    } else {
      // touch devices: do not auto-open mini-cart. Ensure it's hidden.
      mini.classList.remove("visible");
      mini.setAttribute("aria-hidden", "true");
      // Optionally, clicking the caret/button could toggle a small panel; we
      // prefer to keep behavior simple: click on the cart opens the full drawer
      // (existing behavior). To avoid accidental opens while scrolling, we
      // do not attach touch-based show handlers.
      if (openBtn) {
        openBtn.addEventListener("focus", function () {
          // keep accessible focus behavior but do not force show
          try {
            renderMiniCart();
          } catch (e) {}
        });
      }
    }
  })();

  // --- Optimistic toast for add-to-cart with undo ---
  let lastAdded = null;

  function showToast(message, undoCallback) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    // ensure element is visible if it was present in DOM with display:none
    toast.style.display = "";
    toast.innerHTML = "";
    const msg = document.createElement("div");
    msg.className = "toast-message";
    msg.textContent = message;
    const actions = document.createElement("div");
    actions.className = "toast-actions";
    if (typeof undoCallback === "function") {
      const undo = document.createElement("button");
      undo.type = "button";
      undo.className = "btn btn-link";
      undo.textContent = "Undo";
      undo.addEventListener("click", function () {
        try {
          undoCallback();
        } catch (e) {}
        hideToast(toast);
      });
      actions.appendChild(undo);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn-link";
    close.textContent = "×";
    close.addEventListener("click", function () {
      hideToast(toast);
    });
    actions.appendChild(close);
    toast.appendChild(msg);
    toast.appendChild(actions);
    toast.classList.add("visible");
    toast.setAttribute("aria-hidden", "false");
    // auto-dismiss
    setTimeout(function () {
      hideToast(toast);
    }, 3800);
  }

  function hideToast(toast) {
    if (!toast) toast = document.getElementById("toast");
    if (!toast) return;
    toast.classList.remove("visible");
    toast.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 420);
  }

  // wire add-to-cart buttons (delegate so late-rendered cards work site-wide)
  document.addEventListener("click", function (event) {
    const btn = event.target.closest(".add-to-cart");
    if (!btn) return;
    event.preventDefault();
    const card = btn.closest(".product-card");
    const id = card ? card.dataset.id : null;
    addToCartById(id || "");
  });

  // open/close drawer
  const cartIcon = document.querySelector(".cart-icon");
  const cartDrawer = document.getElementById("cart-drawer");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartClose = document.getElementById("cart-close");
  if (cartIcon && cartDrawer) {
    cartIcon.addEventListener("click", function () {
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
      renderCart();
      // show overlay and prevent background scroll
      if (cartOverlay) {
        cartOverlay.classList.add("visible");
        cartOverlay.setAttribute("aria-hidden", "false");
      }
      try {
        document.body.style.overflow = "hidden";
      } catch (e) {}
      // hide mini-chart dropdown while drawer is open
      try {
        hideMiniCart();
      } catch (e) {}
    });
  }
  if (cartClose && cartDrawer) {
    cartClose.addEventListener("click", function () {
      cartDrawer.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
      if (cartOverlay) {
        cartOverlay.classList.remove("visible");
        cartOverlay.setAttribute("aria-hidden", "true");
      }
      try {
        document.body.style.overflow = "";
      } catch (e) {}
    });
  }

  // click overlay to close drawer
  if (cartOverlay) {
    cartOverlay.addEventListener("click", function () {
      if (cartDrawer) {
        cartDrawer.classList.remove("open");
        cartDrawer.setAttribute("aria-hidden", "true");
      }
      cartOverlay.classList.remove("visible");
      cartOverlay.setAttribute("aria-hidden", "true");
      try {
        document.body.style.overflow = "";
      } catch (e) {}
    });
  }

  // close drawer with Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (cartDrawer && cartDrawer.classList.contains("open")) {
        cartDrawer.classList.remove("open");
        cartDrawer.setAttribute("aria-hidden", "true");
        if (cartOverlay) {
          cartOverlay.classList.remove("visible");
          cartOverlay.setAttribute("aria-hidden", "true");
        }
        try {
          document.body.style.overflow = "";
        } catch (e) {}
      }

      // close drawer when user clicks the Start shopping CTA in the empty drawer/mini-cart
      document.addEventListener("click", function (e) {
        const a =
          e.target.closest &&
          e.target.closest(".empty-cta, .mini-empty-cta a, .mini-start");
        if (a) {
          // allow default navigation, but close drawer and overlay
          if (cartDrawer) {
            cartDrawer.classList.remove("open");
            cartDrawer.setAttribute("aria-hidden", "true");
          }
          if (cartOverlay) {
            cartOverlay.classList.remove("visible");
            cartOverlay.setAttribute("aria-hidden", "true");
          }
          try {
            document.body.style.overflow = "";
          } catch (e) {}
        }
      });
    }
  });

  // checkout placeholder
  const checkoutBtn = document.getElementById("cart-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      // simple behaviour: if cart empty, alert, else navigate to a placeholder
      const qty = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
      if (qty === 0) {
        alert("Your cart is empty");
        return;
      }
      // go to the new Jumia-style checkout page
      window.location.href = "jumia-checkout.html";
    });
  }

  // Check if returning from checkout - clear cart BEFORE loading
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cart_cleared") === "1") {
    console.log("=== CART CLEARING PROCESS ===");
    console.log("URL parameter detected:", window.location.search);
    console.log(
      "Cart in localStorage BEFORE clear:",
      localStorage.getItem(CART_KEY)
    );

    localStorage.removeItem(CART_KEY);

    console.log(
      "Cart in localStorage AFTER clear:",
      localStorage.getItem(CART_KEY)
    );
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log("=== CART CLEARED ===");
  } else {
    if (consumeCartStatusFlag("initial load")) {
      console.log("Cart cleared via status flag on load");
    }
  }

  // load initial cart state (will be empty if we just cleared it above)
  loadCart();
  renderCart();

  // Listen for cart changes from other tabs/windows (e.g., after checkout)
  window.addEventListener("storage", function (e) {
    if (e.key === CART_KEY || e.key === CART_STATUS_KEY) {
      loadCart();
      renderCart();
    }
  });

  function refreshCartFromStorage(reason) {
    try {
      console.log("Refreshing cart due to:", reason);
    } catch (e) {}
    consumeCartStatusFlag(reason + " status flag");
    loadCart();
    renderCart();
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      refreshCartFromStorage("pageshow (bfcache)");
    }
  });

  window.addEventListener("focus", function () {
    if (document.visibilityState === "visible") {
      refreshCartFromStorage("window focus");
    }
  });

  window.addEventListener("message", function (event) {
    if (event && event.data && event.data.type === "CART_CLEARED") {
      refreshCartFromStorage("checkout CART_CLEARED message");
    }
  });

  // Contact form submission (contact.html)
  const contactForm = document.getElementById("contact-support-form");
  if (contactForm) {
    // Generate CSRF token for contact form
    const contactCSRFToken = Array.from(
      crypto.getRandomValues(new Uint8Array(32))
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    sessionStorage.setItem("contactCSRFToken", contactCSRFToken);
    const csrfField = document.getElementById("contact-csrf-token");
    if (csrfField) csrfField.value = contactCSRFToken;

    const statusEl = document.getElementById("contact-status");
    const submitBtn = contactForm.querySelector("button[type='submit']");
    const endpoints = [
      "/.netlify/functions/contact-message",
      "/api/contact-message",
    ];

    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove("form-status-success", "form-status-error");
      if (type === "success") statusEl.classList.add("form-status-success");
      else if (type === "error") statusEl.classList.add("form-status-error");
    }

    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      // CSRF token validation (backwards compatible)
      const submittedToken =
        document.getElementById("contact-csrf-token")?.value;
      const storedToken = sessionStorage.getItem("contactCSRFToken");

      // Only validate if both tokens exist (backwards compatible with pages loaded before CSRF)
      if (submittedToken && storedToken && submittedToken !== storedToken) {
        setStatus("Invalid security token. Please refresh the page.", "error");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus("Sending message…", "info");

      const formData = new FormData(contactForm);
      const payload = {
        name: formData.get("full-name") || "",
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
        topic: formData.get("topic") || "",
        message: formData.get("message") || "",
        source: "contact.html",
      };

      let success = false;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const isJson = response.headers
            .get("content-type")
            ?.includes("application/json");
          const result = isJson ? await response.json() : {};
          if (response.ok && result && result.success) {
            success = true;
            break;
          }
        } catch (err) {
          console.warn("Contact form endpoint failed", endpoint, err);
        }
      }

      // Local fallback: save to localStorage for development
      if (!success) {
        try {
          const messageWithTimestamp = {
            ...payload,
            createdAt: new Date().toISOString(),
            id:
              "msg-" +
              Date.now() +
              "-" +
              Math.random().toString(36).substr(2, 9),
          };

          // Store in localStorage
          const stored = localStorage.getItem("contactMessages") || "[]";
          const messages = JSON.parse(stored);
          messages.push(messageWithTimestamp);
          localStorage.setItem("contactMessages", JSON.stringify(messages));

          success = true;
          console.log("Message saved locally:", messageWithTimestamp);
        } catch (err) {
          console.warn("Local storage fallback failed", err);
        }
      }

      if (success) {
        contactForm.reset();
        setStatus("Message sent! We'll be in touch shortly.", "success");
      } else {
        setStatus(
          "We couldn't send your message. Please try again or use WhatsApp/email.",
          "error"
        );
      }

      if (submitBtn) submitBtn.disabled = false;
    });
  }
});
