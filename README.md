# VisionStyle Eyewear E-Commerce Website

A modern, responsive e-commerce website for eyewear products with complete customer dashboard functionality.

## 📁 Project Structure

```
HTML 2/
│
├── index.html                  # Homepage
├── login.html                  # Login/Register page
├── checkout.html               # Checkout page
├── order-confirmation.html     # Order confirmation page
├── 404.html                    # 404 error page
│
├── css/                        # Stylesheets
│   ├── styles.css              # Main stylesheet
│   └── styles.css.backup       # Backup stylesheet
│
├── js/                         # JavaScript files
│   ├── script.js               # Main site JavaScript
│   ├── features.js             # Additional features
│   ├── product-detail.js       # Product detail functionality
│   ├── contact-store.js        # Contact message management (Node.js)
│   └── order-store.js          # Order management (Node.js)
│
├── data/                       # JSON data files
│   ├── products.json           # Product catalog
│   ├── orders.json             # Order history
│   └── contacts.json           # Contact messages
│
├── pages/                      # Secondary pages
│   ├── about.html              # About us page
│   ├── categories.html         # Product categories
│   ├── contact.html            # Contact form
│   ├── faq.html                # FAQ page
│   ├── privacy.html            # Privacy policy
│   ├── terms.html              # Terms of service
│   ├── size-guide.html         # Eyewear size guide
│   ├── search-results.html     # Search results page
│   ├── product.html            # Product page (legacy)
│   ├── product-detail.html     # Product detail page
│   ├── products.html           # Products listing
│   │
│   └── customer/               # Customer dashboard pages
│       ├── customer-orders.html    # Order history
│       ├── customer-inbox.html     # Customer inbox
│       ├── customer-reviews.html   # Product reviews
│       └── customer-wishlist.html  # Wishlist
│
└── README.md                   # This file

```

## 🎨 Color Scheme

- Primary: `#3498db` (Blue)
- Secondary: `#9b59b6` (Purple)
- Success: `#1eb981` (Green)
- Dark: `#2c3e50` (Navy)

## 🔑 Key Features

### Frontend Features

- Responsive navigation with mobile menu
- Product catalog with filtering
- Shopping cart functionality
- User authentication system
- Customer dashboard (Orders, Reviews, Wishlist, Inbox)
- Search functionality
- Contact form

### Customer Dashboard

- **Orders**: View order history with tracking
- **Reviews**: Write and manage product reviews
- **Wishlist**: Save favorite products
- **Inbox**: Customer support messages

### Data Storage

- LocalStorage for cart items
- SessionStorage for user sessions
- JSON files for product/order data

## 🚀 Getting Started

### Running Locally

1. **Simple HTTP Server** (Recommended)

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx http-server -p 8000
   ```

2. **Open in Browser**
   ```
   http://localhost:8000
   ```

### File References

**Main files remain in root:**

- `index.html` - Homepage (unchanged)
- `login.html` - Login page (unchanged)
- `checkout.html` - Checkout (unchanged)
- `order-confirmation.html` - Order confirmation (unchanged)
- `404.html` - Error page (unchanged)

**Other pages moved to `/pages/`:**

- Access via: `pages/about.html`, `pages/contact.html`, etc.

**Customer pages moved to `/pages/customer/`:**

- Access via: `pages/customer/customer-orders.html`, etc.

**Resources:**

- CSS: `css/styles.css`
- JavaScript: `js/script.js`, `js/features.js`
- Data: `data/products.json`, `data/orders.json`

## 📝 Session & Storage Keys

### SessionStorage

- `visionStyleAuthSession` - User session data

### LocalStorage

- `cart` - Shopping cart items
- `orders` - Order history
- `visionStyleAuthAccounts` - User accounts
- `wishlist_{email}` - User wishlist
- `reviews_{email}` - User reviews
- `contactMessages` - Contact form submissions

## 🔧 Configuration

### Authentication

- Session expires after 4 hours
- Inactivity timeout: 30 minutes
- Password hashing: SHA-256

### Checkout Flow

1. Add items to cart
2. Proceed to checkout (requires login)
3. Fill shipping details
4. Complete payment
5. Order confirmation

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🎯 TODO / Future Enhancements

- [ ] Backend API integration
- [ ] Real payment gateway
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Product image gallery
- [ ] Advanced search filters
- [ ] Order tracking API
- [ ] Customer reviews moderation

## 📄 License

All rights reserved - VisionStyle Eyewear 2026

---

**Note**: The `.js` files in the `js/` folder include Node.js modules (`contact-store.js`, `order-store.js`) that require a backend server. The current site is fully functional with frontend-only localStorage.
