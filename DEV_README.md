Local dev: run serverless functions and test payment flow

This project uses simple static HTML/CSS/JS and optional serverless functions for notifications and payment verification.

Quick local testing (Netlify CLI)

1. Install Netlify CLI (if you don't have it):

```powershell
npm install -g netlify-cli
```

2. Run the site with Netlify dev to serve functions locally:

```powershell
# from project root
setx PERSIST_ORDERS local
# on current shell only (PowerShell):
$env:PERSIST_ORDERS = 'local'
# then run
netlify dev
```

This will serve functions under `/.netlify/functions/*` — e.g. `/.netlify/functions/verify-payment`.

Quick local testing (Vercel CLI)

1. Install Vercel CLI:

```powershell
npm install -g vercel
```

2. Set env var for current shell (PowerShell):

```powershell
$env:PERSIST_ORDERS = 'local'
```

3. Run:

```powershell
vercel dev
```

Notes

- To test Paystack verification end-to-end you need Paystack test keys. Set `PAYSTACK_SECRET_KEY` (server) and `PAYSTACK_PUBLIC_KEY` (client) in your environment or in the dashboard when deployed.
- For Email/SMS notifications configure SendGrid and Twilio env vars. When `PERSIST_ORDERS=local` orders will be appended to `orders.json` in the project root for easy inspection.
- The client Paystack public key is currently left empty in `cart.html` — fill in your test key to enable the Paystack checkout widget.
- To test Paystack verification end-to-end you need Paystack test keys. Set `PAYSTACK_SECRET_KEY` (server) in your function env and provide the public key to the client.
  - Client options: add a meta tag in your HTML (recommended for static sites):
  <meta name="paystack-public-key" content="pk_test_xxx" />
  - Or set a global in a small script before `cart.html` loads:
  <script>window.PAYSTACK_PUBLIC_KEY = 'pk_test_xxx';</script>
- For Email/SMS notifications configure SendGrid and Twilio env vars. When `PERSIST_ORDERS=local` orders will be appended to `orders.json` in the project root for easy inspection.
- The Paystack public key can be omitted to keep the previous fallback flows (serverless send-order / EmailJS / local simulation).
- Mobile money (MoMo) support: Paystack supports mobile money channels in Ghana. To charge via MoMo the checkout needs a phone number and Paystack test keys that enable mobile money in your account. The client will pass the phone number to Paystack when you select the Mobile Money option at checkout.
- New server endpoint: `/api/init-payment` (Vercel) and `/.netlify/functions/init-payment` (Netlify) — initializes a Paystack transaction and returns the initialization object. Use this for Mobile Money (MoMo) or server-driven flows. Example client flow in `payments-test.html`.
- Test page: `payments-test.html` demonstrates inline card checkout and server-init MoMo flow (redirects to Paystack authorization URL when available).
- Webhooks: You can configure Paystack to POST events to `/api/paystack-webhook` (Vercel) or `/.netlify/functions/paystack-webhook` (Netlify). The webhook handler verifies the HMAC signature (x-paystack-signature), re-verifies the transaction via Paystack, sends notifications (SendGrid/Twilio) and appends to `orders.json` when `PERSIST_ORDERS=local`.
  - To register a webhook in Paystack dashboard, set the URL to your deployed function (e.g. https://your-site.com/api/paystack-webhook) and ensure the PAYSTACK_SECRET_KEY env var on your server matches your Paystack secret key.
- Admin viewer (dev): `admin/orders.html` — a small dev-only UI to inspect `orders.json`. It uses a simple prompt-based password (default `devpass`) or `?pw=devpass` query param. This is for local/dev inspection only — do not expose it in production raw.
- Admin sign-in & dashboard access: `sign-in.html` posts to `/api/login` (Vercel) or `/.netlify/functions/login` (Netlify). Configure these env vars on both hosting targets:
  - `ADMIN_USERNAME` — the account name.
  - `ADMIN_PASSWORD_HASH` — SHA-256 hash of the password (generate via `node -e "console.log(require('crypto').createHash('sha256').update('yourpassword').digest('hex'))"`).
  - `CONTACT_ADMIN_TOKEN` — shared token returned after login and used to authorize `/api/contact-messages`.
  - Optional overrides: `CONTACT_SENDGRID_*`, `CONTACT_NOTIFY_EMAILS`, `CONTACT_NOTIFY_PHONE`, `TWILIO_*` for contact notifications.
    After successful login the returned token is stored in `localStorage` and appended as `?key=` query param when redirecting to `admin/messages.html`.
