# Contact Form Setup (Cloudflare Worker + Turnstile + Resend)

## 1) Create Cloudflare Turnstile
- Create a Turnstile widget in Cloudflare dashboard.
- Add your domain to allowed hostnames.
- Copy:
  - Site key -> set `VITE_TURNSTILE_SITE_KEY` in frontend env.
  - Secret key -> set as worker secret `TURNSTILE_SECRET_KEY`.

## 2) Create Resend API key
- Create an API key in Resend.
- Verify your sending domain in Resend.
- Use a verified sender for `RESEND_FROM` in `wrangler.toml`.

## 3) Configure worker vars/secrets
- Edit `worker/wrangler.toml`:
  - `ALLOWED_ORIGIN`
  - `RESEND_FROM`
  - `RESEND_TO`
- Set secrets:
```bash
cd worker
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put RESEND_API_KEY
```

## 4) Deploy worker
```bash
cd worker
wrangler deploy
```
- Copy deployed Worker URL (for example `https://arty-contact-worker.<subdomain>.workers.dev`).

## 5) Configure frontend env
- In project root, create `.env`:
```bash
VITE_CONTACT_ENDPOINT="https://arty-contact-worker.<subdomain>.workers.dev"
VITE_TURNSTILE_SITE_KEY="<your-site-key>"
```

## 6) Deploy frontend
- Redeploy your Vite site (Vercel/Cloudflare Pages/etc) with those two env variables.

## Notes
- This setup keeps recurring cost near zero for low-to-moderate volume.
- Turnstile blocks basic bot spam before email delivery.
- Worker returns CORS headers and validates payload before sending.
