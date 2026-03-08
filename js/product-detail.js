// Product Detail Page JavaScript

let currentProduct = null;
let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Load products from JSON file
  try {
    const response = await fetch('../data/products.json');
    allProducts = await response.json();
    
    // Find the product by ID
    currentProduct = allProducts.find(p => p.id === productId);
    
    if (currentProduct) {
      loadProductData(currentProduct);
      loadRelatedProducts(currentProduct.category);
      loadReviews(currentProduct);
    } else {
      // If product not found, show first product
      currentProduct = allProducts[0];
      loadProductData(currentProduct);
      loadRelatedProducts(currentProduct.category);
      loadReviews(currentProduct);
    }
  } catch (error) {
    console.error('Error loading product:', error);
  }

  loadRecentlyViewed();
  initializeProductOptions();
  initializeTabs();
  initializeModals();
  initializeReviewForm();
  if (productId) trackRecentlyViewed(productId);
});

function loadProductData(product) {
  // Update page title
  document.title = `${product.title} - GlamourGold`;

  // Update breadcrumb
  document.getElementById("productBreadcrumb").textContent = product.title;

  // Update product info
  document.getElementById("productTitle").textContent = product.title;
  document.getElementById("productPrice").textContent = `$${product.price.toFixed(2)}`;
  document.getElementById("productDescription").textContent = product.description;

  // Update original price if exists
  const originalPriceEl = document.querySelector(".original-price");
  if (originalPriceEl && product.originalPrice) {
    originalPriceEl.textContent = `$${product.originalPrice.toFixed(2)}`;
  }

  // Update discount badge
  const discountBadge = document.querySelector(".discount-badge");
  if (discountBadge && product.discount) {
    discountBadge.textContent = `${product.discount}% OFF`;
  }

  // Update main image
  const mainImage = document.getElementById("mainProductImage");
  mainImage.src = '../' + product.img;
  mainImage.alt = product.title;

  // Update thumbnails with same image (single image per product)
  const thumbnailContainer = document.getElementById("thumbnailImages");
  if (thumbnailContainer) {
    thumbnailContainer.innerHTML = `
      <img src="../${product.img}" alt="${product.title}" class="active" data-full="../${product.img}" />
    `;
  }

  // Update stock status
  const stockStatus = document.querySelector(".stock-status");
  if (stockStatus) {
    stockStatus.innerHTML = `<i class="fas fa-check-circle"></i> In Stock`;
    stockStatus.className = "stock-status in-stock";
  }

  // Update rating
  const reviewCount = product.reviews ? product.reviews.length : 0;
  const avgRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : 5;
  
  const ratingCountEl = document.querySelector(".rating-count");
  if (ratingCountEl) {
    ratingCountEl.textContent = `(${reviewCount} reviews)`;
  }

  // Update category badge
  const categoryBadge = document.querySelector(".badge.new");
  if (categoryBadge) {
    categoryBadge.textContent = product.category;
  }
}

function loadReviews(product) {
  const reviewsList = document.querySelector(".reviews-list");
  const reviewsTab = document.querySelector('[data-tab="reviews"]');
  
  if (!product.reviews || product.reviews.length === 0) {
    if (reviewsList) {
      reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review this product!</p>';
    }
    if (reviewsTab) {
      reviewsTab.textContent = 'Reviews (0)';
    }
    return;
  }

  // Update reviews tab count
  if (reviewsTab) {
    reviewsTab.textContent = `Reviews (${product.reviews.length})`;
  }

  // Update rating summary
  const avgRating = (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1);
  const ratingNumber = document.querySelector(".rating-number");
  if (ratingNumber) {
    ratingNumber.textContent = avgRating;
  }

  const basedOnReviews = document.querySelector(".rating-summary span");
  if (basedOnReviews) {
    basedOnReviews.textContent = `Based on ${product.reviews.length} reviews`;
  }

  // Generate review HTML
  if (reviewsList) {
    reviewsList.innerHTML = product.reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="avatar">${review.name.split(' ').map(n => n[0]).join('')}</div>
            <div>
              <strong>${review.name}</strong>
              <span class="verified"><i class="fas fa-check-circle"></i> Verified Purchase</span>
            </div>
          </div>
          <div class="review-date">${new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="review-rating">
          ${'<i class="fas fa-star"></i>'.repeat(review.rating)}${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
        </div>
        <p>${review.comment}</p>
        <div class="review-helpful">
          <span>Was this helpful?</span>
          <button><i class="fas fa-thumbs-up"></i> Yes</button>
          <button><i class="fas fa-thumbs-down"></i> No</button>
        </div>
      </div>
    `).join('');
  }
}

function loadRelatedProducts(category) {
  const relatedContainer = document.querySelector(".related-products .product-grid, .related-products-grid");
  if (!relatedContainer) return;

  // Get products from same category, excluding current product
  const related = allProducts
    .filter(p => p.category === category && p.id !== currentProduct.id)
    .slice(0, 4);

  if (related.length === 0) {
    // If no related products in same category, show random products
    const randomProducts = allProducts
      .filter(p => p.id !== currentProduct.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    
    relatedContainer.innerHTML = randomProducts.map(p => createProductCard(p)).join('');
  } else {
    relatedContainer.innerHTML = related.map(p => createProductCard(p)).join('');
  }
}

function createProductCard(product) {
  const avgRating = product.reviews && product.reviews.length > 0
    ? Math.round(product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length)
    : 5;

  return `
    <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
      <div class="product-image">
        <img src="../${product.img}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" />
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.title}</h3>
        <div class="product-rating">
          <span class="stars">${'⭐'.repeat(avgRating)}</span>
          <span class="review-count">(${product.reviews ? product.reviews.length : 0} reviews)</span>
        </div>
        <p class="product-price">$${product.price} ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ''}</p>
      </div>
    </div>
  `;
}

function initializeProductOptions() {
  // Color selection
  document.querySelectorAll(".color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".color-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("selectedColor").textContent = btn.dataset.color;
    });
  });

  // Size selection
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".size-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Lens type selection
  document.querySelectorAll(".lens-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".lens-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updatePrice();
    });
  });

  // Quantity controls
  const qtyInput = document.getElementById("productQuantity");
  document.querySelector(".qty-btn.minus").addEventListener("click", () => {
    if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  document.querySelector(".qty-btn.plus").addEventListener("click", () => {
    if (qtyInput.value < 10) qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  // Add to cart
  document.getElementById("addToCartBtn").addEventListener("click", addToCart);

  // Buy now
  document.getElementById("buyNowBtn").addEventListener("click", () => {
    addToCart();
    window.location.href = "checkout.html";
  });

  // Wishlist
  document
    .getElementById("wishlistBtn")
    .addEventListener("click", toggleWishlist);
}

function updatePrice() {
  const basePrice = 149.99;
  const activeLens = document.querySelector(".lens-btn.active");
  let additionalCost = 0;

  if (activeLens) {
    const lensType = activeLens.dataset.lens;
    if (lensType === "Polarized") additionalCost = 30;
    else if (lensType === "Prescription") additionalCost = 50;
  }

  document.getElementById("productPrice").textContent =
    `$${(basePrice + additionalCost).toFixed(2)}`;
}

function addToCart() {
  const product = {
    id: new URLSearchParams(window.location.search).get("id") || "1",
    name: document.getElementById("productTitle").textContent,
    price: parseFloat(
      document.getElementById("productPrice").textContent.replace("$", ""),
    ),
    quantity: parseInt(document.getElementById("productQuantity").value),
    color: document.getElementById("selectedColor").textContent,
    size: document.querySelector(".size-btn.active")?.dataset.size || "Medium",
    lens:
      document.querySelector(".lens-btn.active")?.dataset.lens || "Standard",
    image: document.getElementById("mainProductImage").src,
  };

  // Get existing cart
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Check if item exists
  const existingIndex = cart.findIndex(
    (item) =>
      item.id === product.id &&
      item.color === product.color &&
      item.size === product.size &&
      item.lens === product.lens,
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += product.quantity;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast("Item added to cart!");
}

function toggleWishlist() {
  const btn = document.getElementById("wishlistBtn");
  const icon = btn.querySelector("i");

  if (icon.classList.contains("far")) {
    icon.classList.remove("far");
    icon.classList.add("fas");
    btn.classList.add("active");
    showToast("Added to wishlist!");
  } else {
    icon.classList.remove("fas");
    icon.classList.add("far");
    btn.classList.remove("active");
    showToast("Removed from wishlist");
  }
}

function initializeTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
}

function initializeModals() {
  // Share modal
  document.getElementById("shareBtn").addEventListener("click", () => {
    document.getElementById("shareModal").classList.add("active");
    document.getElementById("shareLink").value = window.location.href;
  });

  // Try-on modal
  document.getElementById("tryOnBtn").addEventListener("click", () => {
    document.getElementById("tryOnModal").classList.add("active");
  });

  // Write review modal
  document
    .querySelectorAll(".write-review-btn, .write-review")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("reviewModal").classList.add("active");
      });
    });

  // Close modals
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.remove("active");
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });

  // Copy link
  document.getElementById("copyLink").addEventListener("click", () => {
    const input = document.getElementById("shareLink");
    input.select();
    document.execCommand("copy");
    showToast("Link copied to clipboard!");
  });

  // Virtual try-on camera
  document.getElementById("startCamera").addEventListener("click", startCamera);
}

async function startCamera() {
  try {
    const video = document.getElementById("tryOnVideo");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    video.srcObject = stream;
    document.getElementById("startCamera").style.display = "none";
    document.getElementById("capturePhoto").style.display = "inline-flex";
  } catch (err) {
    showToast("Could not access camera");
    console.error(err);
  }
}

function initializeReviewForm() {
  // Star rating input
  const stars = document.querySelectorAll(".star-rating-input i");
  let selectedRating = 0;

  stars.forEach((star) => {
    star.addEventListener("mouseenter", () => {
      const rating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => {
        if (i < rating) {
          s.classList.remove("far");
          s.classList.add("fas");
        } else {
          s.classList.remove("fas");
          s.classList.add("far");
        }
      });
    });

    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.rating);
    });
  });

  document
    .querySelector(".star-rating-input")
    .addEventListener("mouseleave", () => {
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.remove("far");
          s.classList.add("fas");
        } else {
          s.classList.remove("fas");
          s.classList.add("far");
        }
      });
    });

  // Form submission
  document.getElementById("reviewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Thank you for your review!");
    document.getElementById("reviewModal").classList.remove("active");
    e.target.reset();
    selectedRating = 0;
  });
}

function loadRelatedProducts() {
  const container = document.getElementById("relatedProducts");
  const products = [
    {
      id: 2,
      name: "Modern Rectangle Frames",
      price: 129.99,
      image:
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400",
      rating: 4.3,
    },
    {
      id: 3,
      name: "Retro Round Glasses",
      price: 119.99,
      image:
        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400",
      rating: 4.6,
    },
    {
      id: 4,
      name: "Sports Sunglasses",
      price: 159.99,
      image:
        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=400",
      rating: 4.4,
    },
    {
      id: 5,
      name: "Cat Eye Frames",
      price: 139.99,
      image:
        "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400",
      rating: 4.7,
    },
  ];

  container.innerHTML = products
    .map(
      (p) => `
    <div class="product-card">
      <div class="product-image-container">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="product-actions-overlay">
          <button class="action-btn quick-view" title="Quick View"><i class="fas fa-eye"></i></button>
          <button class="action-btn add-wishlist" title="Add to Wishlist"><i class="far fa-heart"></i></button>
        </div>
      </div>
      <div class="product-info-card">
        <h3>${p.name}</h3>
        <div class="product-rating">
          ${'<i class="fas fa-star"></i>'.repeat(Math.floor(p.rating))}
          ${p.rating % 1 ? '<i class="fas fa-star-half-alt"></i>' : ""}
        </div>
        <div class="product-price">
          <span class="price">$${p.price.toFixed(2)}</span>
        </div>
        <a href="product-detail.html?id=${p.id}" class="btn btn-primary">View Details</a>
      </div>
    </div>
  `,
    )
    .join("");
}

function trackRecentlyViewed(productId) {
  let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

  // Remove if already exists
  recentlyViewed = recentlyViewed.filter((id) => id !== productId);

  // Add to beginning
  recentlyViewed.unshift(productId);

  // Keep only last 8
  recentlyViewed = recentlyViewed.slice(0, 8);

  localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
}

function loadRecentlyViewed() {
  const recentlyViewed =
    JSON.parse(localStorage.getItem("recentlyViewed")) || [];

  if (recentlyViewed.length > 1) {
    document.getElementById("recentlyViewedSection").style.display = "block";
    // In real app, fetch products from API
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMessage").textContent = message;
  toast.classList.add("active");
  setTimeout(() => toast.classList.remove("active"), 3000);
}

// Initialize cart count on page load
updateCartCount();
