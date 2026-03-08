// Live Chat Widget Component
class LiveChatWidget {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
    this.addWelcomeMessage();
  }

  createWidget() {
    const widget = document.createElement("div");
    widget.className = "live-chat-widget";
    widget.innerHTML = `
      <button class="chat-toggle" id="chatToggle">
        <i class="fas fa-comments"></i>
      </button>
      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <h4><i class="fas fa-headset"></i> VisionStyle Support</h4>
          <p>We typically reply within minutes</p>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
          <input type="text" id="chatInput" placeholder="Type your message..." />
          <button id="sendMessage"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
    document.body.appendChild(widget);
  }

  attachEventListeners() {
    const toggle = document.getElementById("chatToggle");
    const chatWindow = document.getElementById("chatWindow");
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");

    toggle.addEventListener("click", () => {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle("active", this.isOpen);
      toggle.innerHTML = this.isOpen
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-comments"></i>';
      if (this.isOpen) {
        input.focus();
      }
    });

    sendBtn.addEventListener("click", () => this.sendMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  }

  addWelcomeMessage() {
    setTimeout(() => {
      this.addBotMessage(
        "👋 Hi there! Welcome to VisionStyle. How can I help you today?",
      );
    }, 500);
  }

  sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (!message) return;

    this.addUserMessage(message);
    input.value = "";

    // Simulate bot response
    setTimeout(() => {
      this.getBotResponse(message);
    }, 1000);
  }

  addUserMessage(text) {
    const messages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message user";
    messageDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  addBotMessage(text) {
    const messages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message bot";
    messageDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let response = "";

    if (
      lowerMessage.includes("shipping") ||
      lowerMessage.includes("delivery")
    ) {
      response =
        "📦 We offer Standard (5-7 days, $5.99), Express (2-3 days, $12.99), and Next Day ($24.99) shipping. Free shipping on orders over $100!";
    } else if (
      lowerMessage.includes("return") ||
      lowerMessage.includes("refund")
    ) {
      response =
        "↩️ We have a 30-day return policy. Items must be in original condition. Refunds are processed within 5-7 business days.";
    } else if (lowerMessage.includes("size") || lowerMessage.includes("fit")) {
      response =
        "📏 Check out our <a href='size-guide.html'>Size Guide</a> for detailed measurements. You can also use Virtual Try-On on product pages!";
    } else if (
      lowerMessage.includes("prescription") ||
      lowerMessage.includes("lens")
    ) {
      response =
        "👓 Yes! All frames can be fitted with prescription lenses. You can enter your prescription during checkout or upload it.";
    } else if (
      lowerMessage.includes("track") ||
      lowerMessage.includes("order")
    ) {
      response =
        "📍 You can track your order by logging into your account or using the tracking link in your confirmation email.";
    } else if (
      lowerMessage.includes("payment") ||
      lowerMessage.includes("pay")
    ) {
      response =
        "💳 We accept Visa, MasterCard, American Express, PayPal, and Apple Pay. All payments are secure and encrypted.";
    } else if (lowerMessage.includes("warranty")) {
      response =
        "🛡️ All VisionStyle frames come with a 2-year warranty covering manufacturing and material defects.";
    } else if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      response =
        "Hello! 👋 How can I assist you today? I can help with orders, shipping, returns, sizing, and more!";
    } else if (lowerMessage.includes("thank")) {
      response =
        "You're welcome! 😊 Is there anything else I can help you with?";
    } else if (
      lowerMessage.includes("human") ||
      lowerMessage.includes("agent") ||
      lowerMessage.includes("real person")
    ) {
      response =
        "I'll connect you with a live agent. Please hold for a moment... 📞 In the meantime, you can also email us at support@visionstyle.com or call +1 (555) 123-4567.";
    } else {
      response =
        "Thanks for your message! For more specific help, please check our <a href='faq.html'>FAQ page</a> or contact us at support@visionstyle.com. Is there anything specific I can help you with regarding orders, shipping, or products?";
    }

    this.addBotMessage(response);
  }
}

// Initialize chat widget when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if not on checkout or login pages
  const noChat = ["checkout.html", "login.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (!noChat.includes(currentPage)) {
    new LiveChatWidget();
  }
});

// Compare Products Functionality
class CompareProducts {
  constructor() {
    this.compareList = JSON.parse(localStorage.getItem("compare")) || [];
    this.maxCompare = 4;
  }

  add(productId) {
    if (this.compareList.length >= this.maxCompare) {
      showToast(`Maximum ${this.maxCompare} products can be compared`);
      return false;
    }

    if (!this.compareList.includes(productId)) {
      this.compareList.push(productId);
      this.save();
      showToast("Added to compare list");
      return true;
    }
    return false;
  }

  remove(productId) {
    this.compareList = this.compareList.filter((id) => id !== productId);
    this.save();
  }

  save() {
    localStorage.setItem("compare", JSON.stringify(this.compareList));
  }

  getList() {
    return this.compareList;
  }
}

// Lazy Loading Images
function initLazyLoading() {
  const images = document.querySelectorAll("img[data-src]");

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    },
  );

  images.forEach((img) => imageObserver.observe(img));
}

// Loading Animation
function showPageLoader() {
  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="loader-content">
      <div class="loader-spinner"></div>
      <p>Loading...</p>
    </div>
  `;
  document.body.appendChild(loader);
}

function hidePageLoader() {
  const loader = document.querySelector(".page-loader");
  if (loader) {
    loader.classList.add("fade-out");
    setTimeout(() => loader.remove(), 300);
  }
}

// Recently Viewed Products
class RecentlyViewed {
  constructor() {
    this.key = "recentlyViewed";
    this.maxItems = 8;
  }

  add(productId) {
    let items = this.getAll();
    items = items.filter((id) => id !== productId);
    items.unshift(productId);
    items = items.slice(0, this.maxItems);
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.key)) || [];
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

// Initialize features
document.addEventListener("DOMContentLoaded", () => {
  initLazyLoading();

  // Update recently viewed if on product detail page
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  if (productId && window.location.pathname.includes("product-detail")) {
    const recentlyViewed = new RecentlyViewed();
    recentlyViewed.add(parseInt(productId));
  }
});

// Export for use in other scripts
window.CompareProducts = CompareProducts;
window.RecentlyViewed = RecentlyViewed;
window.showPageLoader = showPageLoader;
window.hidePageLoader = hidePageLoader;
