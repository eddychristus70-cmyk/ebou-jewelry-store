# Admin Access Setup Guide

## How Your Client Accesses the Admin Dashboard

### 🔐 Login Credentials (Default)

**Login URL:** `https://yourdomain.com/admin/login.html`

**Default Credentials:**

- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change these credentials before deploying to production!

---

## 📝 Setup Instructions

### Step 1: Change Admin Password

Edit `admin/login.html` and update the credentials:

```javascript
// Line ~181 - Find this section:
const ADMIN_CREDENTIALS = {
  username: "admin", // Change this
  password: "admin123", // Change this to a strong password
};
```

**Recommended Strong Password:**

- At least 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Example: `EbouJewelry2025!@#`

---

### Step 2: Deployment

#### Option A: Netlify (Recommended)

1. **Push your code to GitHub**
2. **Connect to Netlify:**

   - Go to https://netlify.com
   - Click "New site from Git"
   - Select your repository
   - Deploy!

3. **Additional Security (Optional):**
   - Go to Site Settings → Build & Deploy → Environment
   - Add environment variable: `ADMIN_PASSWORD=YourSecretPassword`
   - Use Netlify Identity for advanced auth

#### Option B: Vercel

1. **Push to GitHub**
2. **Import to Vercel:**
   - Go to https://vercel.com
   - Import your repository
   - Deploy!

---

### Step 3: Share Access with Client

**Send your client:**

🔗 **Admin Panel URL:** `https://yourdomain.com/admin/login.html`

👤 **Username:** `[your-chosen-username]`  
🔑 **Password:** `[your-chosen-password]`

📱 **Instructions:**

1. Go to the admin login page
2. Enter username and password
3. Click "Login to Dashboard"
4. Access all management features

---

## 🔒 Security Features Included

✅ **Session Management**

- 24-hour session expiration
- Auto-logout on session expire
- Remember me option

✅ **Protected Routes**

- Dashboard redirects to login if not authenticated
- Sessions stored securely in localStorage

✅ **Security Headers** (Netlify/Vercel)

- No search engine indexing of admin pages
- XSS protection
- Clickjacking protection

---

## 📊 What Your Client Can Do

From the admin dashboard, they can:

1. **View Orders** - See all customer orders
2. **Read Messages** - Customer contact form submissions
3. **Manage Products** - View product catalog
4. **Track Wishlist** - See which products customers wishlist
5. **View Customers** - Customer data
6. **Export Reports** - Download data for analysis
7. **Update Settings** - Store configuration

---

## 🔧 Advanced Security (Optional)

### Enable Netlify Password Protection

Add to `netlify.toml`:

```toml
[[redirects]]
  from = "/admin/*"
  to = "/admin/:splat"
  status = 200
  force = true
  signed = "API_SECRET_TOKEN"
```

### Use Netlify Identity (Recommended for Production)

1. Enable Netlify Identity in your site dashboard
2. Install `netlify-identity-widget`
3. Replace custom auth with Netlify Identity
4. Manage users from Netlify dashboard

---

## 🆘 Troubleshooting

**Client can't login?**

- Verify credentials are correct
- Check browser console for errors
- Clear browser cache and cookies

**Session keeps expiring?**

- Check "Remember me" option
- Session expires after 24 hours (can be changed in login.html)

**Dashboard shows "No data"?**

- Orders/messages stored in localStorage
- Data persists per browser
- Test by placing an order on the site

---

## 📞 Support

For issues or questions, contact: [your-email@example.com]

---

## 🚀 Quick Start Checklist

- [ ] Change default username/password in `login.html`
- [ ] Deploy to Netlify or Vercel
- [ ] Test login functionality
- [ ] Share credentials with client
- [ ] Verify all dashboard sections work
- [ ] Set up backup/export procedures
- [ ] Configure email notifications (optional)

---

**Last Updated:** December 5, 2025  
**Version:** 1.0
