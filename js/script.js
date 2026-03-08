// Mobile Menu Toggle
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    menuToggle.classList.toggle("active");
  });

  // Close menu when clicking on a link
  const navLinkItems = navLinks.querySelectorAll("a");
  navLinkItems.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      menuToggle.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove("active");
      menuToggle.classList.remove("active");
    }
  });
}

// Load Products from JSON
async function loadProducts() {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

  try {
    const response = await fetch('data/products.json');
    const products = await response.json();
    
    // Display first 12 products on homepage
    const displayProducts = products.slice(0, 12);
    
    productGrid.innerHTML = displayProducts.map(product => {
      const avgRating = product.reviews && product.reviews.length > 0
        ? Math.round(product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length)
        : 5;
      const reviewCount = product.reviews ? product.reviews.length : 0;
      
      return `
        <div class="product-card" data-product="${product.id}" data-price="${product.price}" data-style="${product.category.toLowerCase()}" data-rating="${avgRating}">
          ${product.discount ? `<span class="sale-badge">${product.discount}% OFF</span>` : ''}
          <button class="wishlist-btn" onclick="event.stopPropagation(); toggleWishlist('${product.title}', this)">❤️</button>
          <div class="product-image" onclick="goToProduct('${product.id}')" style="cursor: pointer;">
            <img src="${product.img}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.title}</h3>
            <div class="product-rating">
              <span class="stars">${'⭐'.repeat(avgRating)}</span>
              <span class="review-count">(${reviewCount} reviews)</span>
            </div>
            <p class="product-price">$${product.price} ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ''}</p>
            <p class="product-description">${product.description}</p>
            <div class="product-actions">
              <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.title}', ${product.price})">Add to Cart</button>
              <button class="quick-view-btn" onclick="event.stopPropagation(); goToProduct('${product.id}')">View Details</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading products:', error);
    productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
  }
}

// Navigate to product detail page
function goToProduct(productId) {
  window.location.href = `pages/product-detail.html?id=${productId}`;
}

// Load products on page load
if (document.getElementById('productGrid')) {
  document.addEventListener('DOMContentLoaded', loadProducts);
}

// Expandable Search Bar
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    searchInput.classList.toggle("active");
    if (searchInput.classList.contains("active")) {
      searchInput.focus();
    }
  });

  // Close search bar when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchBtn.contains(e.target)) {
      searchInput.classList.remove("active");
    }
  });

  // Keep search active when typing
  searchInput.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Handle search submission
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && searchInput.value.trim()) {
      window.location.href = `search-results.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  searchBtn.addEventListener("click", (e) => {
    if (searchInput.classList.contains("active") && searchInput.value.trim()) {
      window.location.href = `pages/search-results.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });
}

// Loading Spinner
window.addEventListener("load", () => {
  const loadingSpinner = document.getElementById("loadingSpinner");
  if (loadingSpinner) {
    setTimeout(() => {
      loadingSpinner.classList.add("hidden");
    }, 1000);
  }
});

// Promo Banner
const promoBanner = document.getElementById("promoBanner");
const promoClose = document.getElementById("promoClose");

if (promoClose && promoBanner) {
  promoClose.addEventListener("click", () => {
    promoBanner.classList.add("hidden");
    localStorage.setItem("promoBannerClosed", "true");
  });

  // Check if promo was previously closed
  if (localStorage.getItem("promoBannerClosed") === "true") {
    promoBanner.classList.add("hidden");
  }
}

// Dark Mode Toggle (if element exists)
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.querySelector(".theme-icon");

if (themeToggle && themeIcon) {
  // Check for saved theme preference
  const currentTheme = localStorage.getItem("theme") || "light";
  if (currentTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      themeIcon.textContent = "☀️";
      localStorage.setItem("theme", "dark");
      if (typeof showToast === "function")
        showToast("Dark mode enabled", "info");
    } else {
      themeIcon.textContent = "🌙";
      localStorage.setItem("theme", "light");
      if (typeof showToast === "function")
        showToast("Light mode enabled", "info");
    }
  });
}

// Hero Carousel
const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");
const heroPrev = document.getElementById("heroPrev");
const heroNext = document.getElementById("heroNext");
const heroSection = document.querySelector(".hero");

if (slides.length > 0 && heroPrev && heroNext) {
  let currentSlide = 0;
  let autoSlideInterval;

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    if (index >= slides.length) currentSlide = 0;
    if (index < 0) currentSlide = slides.length - 1;

    slides[currentSlide].classList.add("active");
    dots[currentSlide].classList.add("active");
  }

  function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide--;
    showSlide(currentSlide);
  }

  heroNext.addEventListener("click", () => {
    nextSlide();
    resetAutoSlide();
  });

  heroPrev.addEventListener("click", () => {
    prevSlide();
    resetAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentSlide = index;
      showSlide(currentSlide);
      resetAutoSlide();
    });
  });

  // Auto slide every 5 seconds
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  startAutoSlide();

  // Pause auto-slide on hover
  if (heroSection) {
    heroSection.addEventListener("mouseenter", () => {
      clearInterval(autoSlideInterval);
    });

    heroSection.addEventListener("mouseleave", () => {
      startAutoSlide();
    });
  }
}

// Back to Top Button
const backToTop = document.getElementById("backToTop");

if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// Shopping Cart Functionality
let cartCount = 0;
let cartItems = [];
let wishlistCount = 0;
let wishlistItems = [];

// Initialize cart from localStorage on page load
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartItems = cart; // Load cart items into memory
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    cartCountEl.textContent = count;
  }
  cartCount = count;
}

// Call on page load
updateCartCount();

// User Icon - Navigate to Login
const userIcon = document.getElementById("userIcon");
if (userIcon) {
  userIcon.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

// Cart Modal
const cartModal = document.getElementById("cartModal");
const cartIcon = document.getElementById("cartIcon");
const closeCart = document.getElementById("closeCart");

if (cartIcon) {
  cartIcon.addEventListener("click", () => {
    if (cartModal) {
      cartModal.classList.add("active");
      updateCartDisplay();
    }
  });
}

if (closeCart && cartModal) {
  closeCart.addEventListener("click", () => {
    cartModal.classList.remove("active");
  });

  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) {
      cartModal.classList.remove("active");
    }
  });
}

// Proceed to Checkout Button
const checkoutBtns = document.querySelectorAll(".checkout-btn");
checkoutBtns.forEach((checkoutBtn) => {
  checkoutBtn.addEventListener("click", () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
      showToast("Your cart is empty!", "error");
      return;
    }

    // Check if user is logged in
    const session = JSON.parse(
      sessionStorage.getItem("visionStyleAuthSession"),
    );
    if (!session || !session.isLoggedIn) {
      // Save intended destination
      sessionStorage.setItem("redirectAfterLogin", "checkout.html");
      showToast("Please sign in to continue to checkout", "info");
      window.location.href = "login.html";
      return;
    }

    window.location.href = "checkout.html";
  });
});

function addToCart(productName, price) {
  cartCount++;
  document.getElementById("cartCount").textContent = cartCount;

  // Add to cart array
  cartItems.push({
    name: productName,
    price: price,
    id: Date.now(),
  });

  // Save to localStorage
  localStorage.setItem("cart", JSON.stringify(cartItems));

  // Show toast notification
  showToast(`${productName} added to cart!`, "success");

  updateCartDisplay();
}

function removeFromCart(itemId) {
  const index = cartItems.findIndex((item) => item.id === itemId);
  if (index > -1) {
    cartItems.splice(index, 1);
    cartCount--;
    document.getElementById("cartCount").textContent = cartCount;

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(cartItems));

    updateCartDisplay();
    showToast("Item removed from cart", "info");
  }
}

function updateCartDisplay() {
  const cartItemsContainer = document.getElementById("cartItems");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal = document.getElementById("cartTotal");

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="empty-cart">Your cart is empty</p>';
    cartSubtotal.textContent = "$0.00";
    cartTotal.textContent = "$0.00";
  } else {
    let total = 0;
    cartItemsContainer.innerHTML = cartItems
      .map((item) => {
        total += item.price;
        return `
                <div class="cart-item">
                    <div class="cart-item-icon">👓</div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(
                          2,
                        )}</div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${
                      item.id
                    })">Remove</button>
                </div>
            `;
      })
      .join("");

    cartSubtotal.textContent = `$${total.toFixed(2)}`;
    cartTotal.textContent = `$${total.toFixed(2)}`;
  }
}

// Wishlist Functionality
function toggleWishlist(productName, button) {
  const isActive = button.classList.contains("active");

  if (isActive) {
    button.classList.remove("active");
    wishlistItems = wishlistItems.filter((item) => item !== productName);
    wishlistCount--;
    showToast(`${productName} removed from wishlist`, "info");
  } else {
    button.classList.add("active");
    wishlistItems.push(productName);
    wishlistCount++;
    showToast(`${productName} added to wishlist!`, "success");
  }

  document.getElementById("wishlistCount").textContent = wishlistCount;
}

// Search Functionality - performSearch function
function performSearch() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    if (typeof showToast === "function")
      showToast("Please enter a search term", "info");
    return;
  }

  const productCards = document.querySelectorAll(".product-card");
  let found = 0;

  productCards.forEach((card) => {
    const productName = card
      .querySelector(".product-name")
      .textContent.toLowerCase();
    const productDesc = card
      .querySelector(".product-description")
      .textContent.toLowerCase();

    if (productName.includes(query) || productDesc.includes(query)) {
      card.style.display = "block";
      card.style.animation = "highlight 1s";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  if (found === 0) {
    showToast(`No results found for "${query}"`, "info");
  } else {
    showToast(`Found ${found} product(s)`, "success");
  }

  // Scroll to products section
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
}

// Clear search
searchInput.addEventListener("input", (e) => {
  if (e.target.value === "") {
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach((card) => {
      card.style.display = "block";
    });
  }
});

// Newsletter Functionality
const newsletterForm = document.getElementById("newsletterForm");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterMessage = document.getElementById("newsletterMessage");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterEmail.value;

    // Simple email validation
    if (email && email.includes("@")) {
      newsletterMessage.textContent = "✓ Thank you for subscribing!";
      newsletterMessage.style.color = "#4caf50";
      newsletterEmail.value = "";
      showToast("Successfully subscribed to newsletter!", "success");

      setTimeout(() => {
        newsletterMessage.textContent = "";
      }, 3000);
    } else {
    newsletterMessage.textContent = "✗ Please enter a valid email";
    newsletterMessage.style.color = "#ff6b6b";
  }
  });
}

// Toast Notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = document.getElementById("toastIcon");

  toastMessage.textContent = message;

  // Set color based on type
  if (type === "success") {
    toast.style.background = "#4caf50";
    toastIcon.textContent = "✓";
  } else if (type === "info") {
    toast.style.background = "#2196F3";
    toastIcon.textContent = "ℹ";
  } else if (type === "error") {
    toast.style.background = "#ff6b6b";
    toastIcon.textContent = "✗";
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Product Filters
const priceFilter = document.getElementById("priceFilter");
const styleFilter = document.getElementById("styleFilter");
const sortFilter = document.getElementById("sortFilter");
const clearFiltersBtn = document.getElementById("clearFilters");

function applyFilters() {
  const priceValue = priceFilter.value;
  const styleValue = styleFilter.value;
  const sortValue = sortFilter.value;
  const productCards = Array.from(document.querySelectorAll(".product-card"));

  let visibleProducts = productCards.filter((card) => {
    const price = parseFloat(card.dataset.price);
    const style = card.dataset.style;

    // Price filter
    let priceMatch = true;
    if (priceValue === "0-150") {
      priceMatch = price < 150;
    } else if (priceValue === "150-200") {
      priceMatch = price >= 150 && price <= 200;
    } else if (priceValue === "200+") {
      priceMatch = price > 200;
    }

    // Style filter
    let styleMatch = styleValue === "all" || style === styleValue;

    return priceMatch && styleMatch;
  });

  // Hide non-matching products
  productCards.forEach((card) => {
    if (visibleProducts.includes(card)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  // Sort products
  if (sortValue === "price-low") {
    visibleProducts.sort(
      (a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price),
    );
  } else if (sortValue === "price-high") {
    visibleProducts.sort(
      (a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price),
    );
  } else if (sortValue === "rating") {
    visibleProducts.sort(
      (a, b) => parseInt(b.dataset.rating) - parseInt(a.dataset.rating),
    );
  }

  // Reorder products in DOM
  const productGrid = document.querySelector(".product-grid");
  visibleProducts.forEach((card) => {
    productGrid.appendChild(card);
  });

  showToast(`Showing ${visibleProducts.length} product(s)`, "info");
}

priceFilter.addEventListener("change", applyFilters);
styleFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);

clearFiltersBtn.addEventListener("click", () => {
  priceFilter.value = "all";
  styleFilter.value = "all";
  sortFilter.value = "featured";

  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.style.display = "block";
  });

  showToast("Filters cleared", "info");
});

// Product Comparison
let compareList = [];
const comparisonBar = document.getElementById("comparisonBar");
const compareBtn = document.getElementById("compareBtn");
const clearCompareBtn = document.getElementById("clearCompare");
const compareCount = document.getElementById("compareCount");
const comparisonModal = document.getElementById("comparisonModal");
const closeComparison = document.getElementById("closeComparison");

document.querySelectorAll(".compare-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    const productName = this.dataset.productName;
    const productPrice = this.dataset.productPrice;

    if (this.checked) {
      if (compareList.length < 3) {
        compareList.push({ name: productName, price: productPrice });
        showToast(`${productName} added to comparison`, "success");
      } else {
        this.checked = false;
        showToast("Maximum 3 products for comparison", "info");
      }
    } else {
      compareList = compareList.filter((item) => item.name !== productName);
      showToast(`${productName} removed from comparison`, "info");
    }

    updateComparisonBar();
  });
});

function updateComparisonBar() {
  compareCount.textContent = compareList.length;

  if (compareList.length > 0) {
    comparisonBar.classList.add("active");
    compareBtn.disabled = compareList.length < 2;
  } else {
    comparisonBar.classList.remove("active");
  }
}

compareBtn.addEventListener("click", () => {
  showComparisonModal();
});

clearCompareBtn.addEventListener("click", () => {
  compareList = [];
  document
    .querySelectorAll(".compare-checkbox")
    .forEach((cb) => (cb.checked = false));
  updateComparisonBar();
  showToast("Comparison cleared", "info");
});

function showComparisonModal() {
  const comparisonGrid = document.getElementById("comparisonGrid");

  comparisonGrid.innerHTML = compareList
    .map(
      (product) => `
        <div class="comparison-item">
            <div class="comparison-item-image">👓</div>
            <h3>${product.name}</h3>
            <div class="comparison-item-price">$${product.price}</div>
            <div class="comparison-item-features">
                <h4>Features:</h4>
                <ul>
                    <li>✓ UV400 Protection</li>
                    <li>✓ Premium Materials</li>
                    <li>✓ Adjustable Fit</li>
                    <li>✓ 1 Year Warranty</li>
                    <li>✓ Free Shipping</li>
                </ul>
            </div>
            <button class="add-to-cart" onclick="addToCart('${product.name}', ${product.price})">Add to Cart</button>
        </div>
    `,
    )
    .join("");

  comparisonModal.classList.add("active");
}

closeComparison.addEventListener("click", () => {
  comparisonModal.classList.remove("active");
});

comparisonModal.addEventListener("click", (e) => {
  if (e.target === comparisonModal) {
    comparisonModal.classList.remove("active");
  }
});

// Quick View Modal
const quickViewModal = document.getElementById("quickViewModal");
const closeQuickView = document.getElementById("closeQuickView");
let currentQuickViewProduct = {};

function openQuickView(name, price, imageSrc, description) {
  currentQuickViewProduct = { name, price, imageSrc };

  document.getElementById("quickViewName").textContent = name;
  document.getElementById("quickViewPrice").textContent = `$${price}`;
  document.getElementById("quickViewImage").src = imageSrc;
  document.getElementById("quickViewImage").alt = name;
  document.getElementById("quickViewDescription").textContent = description;

  quickViewModal.classList.add("active");
}

closeQuickView.addEventListener("click", () => {
  quickViewModal.classList.remove("active");
});

quickViewModal.addEventListener("click", (e) => {
  if (e.target === quickViewModal) {
    quickViewModal.classList.remove("active");
  }
});

document.getElementById("addToCartQV").addEventListener("click", () => {
  addToCart(currentQuickViewProduct.name, currentQuickViewProduct.price);
  quickViewModal.classList.remove("active");
});

document.getElementById("wishlistQV").addEventListener("click", () => {
  wishlistItems.push(currentQuickViewProduct.name);
  wishlistCount++;
  document.getElementById("wishlistCount").textContent = wishlistCount;
  showToast(`${currentQuickViewProduct.name} added to wishlist!`, "success");
});

// Image Lightbox
const lightbox = document.getElementById("lightbox");
const closeLightbox = document.getElementById("closeLightbox");

function openLightbox(imageSrc, name) {
  const lightboxImg = document.getElementById("lightboxImage");
  lightboxImg.src = imageSrc;
  lightboxImg.alt = name;
  document.getElementById("lightboxCaption").textContent = name;
  lightbox.classList.add("active");
}

closeLightbox.addEventListener("click", () => {
  lightbox.classList.remove("active");
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target === closeLightbox) {
    lightbox.classList.remove("active");
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    quickViewModal.classList.remove("active");
    comparisonModal.classList.remove("active");
    lightbox.classList.remove("active");
    cartModal.classList.remove("active");
  }
});

// FAQ Accordion
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");

  question.addEventListener("click", () => {
    // Close other open items
    faqItems.forEach((otherItem) => {
      if (otherItem !== item && otherItem.classList.contains("active")) {
        otherItem.classList.remove("active");
      }
    });

    // Toggle current item
    item.classList.toggle("active");
  });
});

// Smooth scroll enhancement for all new sections
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#") {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // Close mobile menu after clicking
        navLinks.classList.remove("active");
      }
    }
  });
});

// Blog card click animation
document.querySelectorAll(".blog-card").forEach((card) => {
  card.addEventListener("click", function (e) {
    if (!e.target.classList.contains("blog-read-more")) {
      const readMoreLink = this.querySelector(".blog-read-more");
      if (readMoreLink) {
        readMoreLink.click();
      }
    }
  });
});

// Social media click tracking (optional)
document.querySelectorAll(".social-icon").forEach((icon) => {
  icon.addEventListener("click", function (e) {
    e.preventDefault();
    const platform = this.getAttribute("title");
    showToast(`Opening ${platform}...`, "info");
    // Add actual social media links here
  });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Close mobile menu after clicking
      navLinks.classList.remove("active");
    }
  });
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove("active");
  }
});

// Scroll Animation - Fade in elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe all cards for animation
window.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(
    ".product-card, .category-card, .feature",
  );
  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });
});

// Responsive Header on Scroll
let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  // Add shadow on scroll
  if (currentScroll > 50) {
    header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
  } else {
    header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  }

  lastScroll = currentScroll;
});

// Window Resize Handler - Update layout on orientation change
window.addEventListener("resize", () => {
  // Close mobile menu on resize to desktop
  if (window.innerWidth > 768) {
    navLinks.classList.remove("active");
  }
});

// Add touch swipe support for mobile menu
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  // Swipe left to close menu
  if (touchStartX - touchEndX > 50 && navLinks.classList.contains("active")) {
    navLinks.classList.remove("active");
  }
  // Swipe right from edge to open menu
  if (
    touchEndX - touchStartX > 50 &&
    touchStartX < 50 &&
    window.innerWidth <= 768
  ) {
    navLinks.classList.add("active");
  }
}

// Product card hover effect enhancement for touch devices
if ("ontouchstart" in window) {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("touchstart", function () {
      this.style.transform = "translateY(-5px)";
    });
    card.addEventListener("touchend", function () {
      setTimeout(() => {
        this.style.transform = "translateY(0)";
      }, 200);
    });
  });
}

// Lazy loading images (if you add real images later)
if ("IntersectionObserver" in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add("loaded");
          imageObserver.unobserve(img);
        }
      }
    });
  });

  const images = document.querySelectorAll("img[data-src]");
  images.forEach((img) => imageObserver.observe(img));
}

// Back to top button functionality (can be added later)
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Console log for debugging on different devices
console.log("VisionStyle Website Loaded");
console.log("Viewport Width:", window.innerWidth);
console.log("Viewport Height:", window.innerHeight);
console.log("Device Pixel Ratio:", window.devicePixelRatio);

// Contact Form Functionality
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formMessage = document.getElementById("formMessage");
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;

    // Simple validation
    if (!name || !email || !subject || !message) {
      formMessage.textContent = "Please fill in all required fields.";
      formMessage.className = "form-message error";
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      formMessage.textContent = "Please enter a valid email address.";
      formMessage.className = "form-message error";
      return;
    }

    // Simulate form submission (in real app, this would send to server)
    formMessage.textContent =
      "Thank you for your message! We'll get back to you soon.";
    formMessage.className = "form-message success";

    // Show toast notification
    showToast("Message sent successfully!", "success");

    // Reset form after 2 seconds
    setTimeout(() => {
      contactForm.reset();
      formMessage.className = "form-message";
    }, 2000);
  });
}
