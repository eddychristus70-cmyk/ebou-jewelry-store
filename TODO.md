# Fix Messy Page — TODO

## Root causes identified

- [x] CSS paths broken (absolute `/styles/...` failed under `file://`) — FIXED
- [x] Broken `<img>` tag in index.html first product card — FIXED
- [x] Nested @media block broke `.mini-cart`, `.toast`, `.drawer-empty` — FIXED
- [ ] `products.json` missing → shop/categories/product/wishlist pages empty
- [ ] `script.js` wrong path on index/shop/contact/categories → cart, menu, search dead
- [ ] Typo paths: `......../assets/...`, `/images/delivery-man-3.jpg`
- [ ] CSS `url(images/...)` references resolve to wrong location
- [ ] Mojibake characters (`?` junk instead of `×`, `—`, `₵`)

## Tasks

### 1. Create products.json

- [ ] Build `public/products.json` with 25 products (from shop.html hardcoded data)
- [ ] Include: id, title, description, price, originalPrice, discount, img, category, tags

### 2. Fix script.js paths

- [ ] `public/index.html` — `script.js` → `js/script.js`
- [ ] `public/shop.html` — `script.js` → `js/script.js`
- [ ] `public/contact.html` — `../js/script.js` → `js/script.js`
- [ ] `public/categories.html` — verify & fix script src
- [ ] `public/product.html` — add `js/script.js` if missing

### 3. Fix typo paths

- [ ] `public/categories.html` — `......../assets/images/favicon-48x48.png` → `/assets/images/favicon-48x48.png`
- [ ] `public/categories.html` — `../assets/images/favicon-192x192.png` → `/assets/images/favicon-192x192.png`
- [ ] `public/index.html` — `/images/delivery-man-3.jpg` → `/assets/images/delivery-man-3.jpg`

### 4. Fix style.css image URLs

- [ ] Replace `url(images/...)` → `url(../assets/images/...)` in `public/styles/style.css`

### 5. Fix mojibake characters

- [ ] Replace junk replacement chars with `×`, `—`, `₵` across all HTML files

## Verification

- [ ] Reload `http://localhost:3000/` — homepage renders, cart works, menu works
- [ ] `/shop.html` — 25 products render
- [ ] `/categories.html` — category sections render
- [ ] `/product.html?id=...` — product details render
- [ ] `/contact.html` — form layout OK
