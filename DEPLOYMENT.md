# Deployment (all free tiers)

Services: **Vercel** (frontend + backend), **MongoDB Atlas**, **TiDB Cloud Starter** (MySQL-compatible), **Upstash Redis**, **Cloudinary**, **Google AI Studio (Gemini)**, **Stripe** (test mode).

> Aiven's free MySQL has been retired, which is why TiDB Cloud Starter is used. If you already have an Aiven free service, export your data before it is deleted (Dec 21, 2026).

## 1. Create the services

1. **TiDB Cloud** - create a Starter cluster, click *Connect*, choose "General". Note host, port (4000), user (like `abc123.root`), password. Create a database, e.g. `ecommerce`.
2. **MongoDB Atlas** - free M0 cluster, create a database user, and under *Network Access* allow `0.0.0.0/0` (Vercel has no fixed IP). Copy the connection string.
3. **Upstash** - create a Redis database, copy the `rediss://...` URL.
4. **Cloudinary** - copy cloud name, API key, API secret from the dashboard.
5. **Gemini** - create an API key at https://aistudio.google.com.
6. **Stripe** - test keys from the dashboard.

## 2. Prepare the data (from your computer)

Put the production values in `backend/.env` (see `.env.example`), then:

```bash
cd backend
npm install
npm run db:sync
npm run seed
npm run admin:create -- --email=you@example.com --password='ChangeMe123!'
```

`db:sync` creates the SQL tables once; the deployed app does not sync on cold starts.

## 3. Deploy the backend

Vercel → *Add New Project* → import the repo → **Root Directory: `backend`**. Add these environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | your frontend URL (comma-separate several) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | from TiDB |
| `MONGODB_URI_ATLAS` | Atlas connection string |
| `REDIS_URL` | Upstash URL |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | long random strings |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary |
| `GEMINI_API_KEY` | Gemini |
| `SMTP_*`, `EMAIL_FROM_NAME` | optional, for emails |

Check `https://<backend>.vercel.app/api/health` responds.

## 4. Deploy the frontend

New Vercel project → **Root Directory: `frontend`**. Set `VITE_API_URL` to `https://<backend>.vercel.app/api` (the Stripe publishable key is served by the backend). `vercel.json` already rewrites all routes to `index.html`.

Then update the backend's `FRONTEND_URL` to the frontend URL and redeploy the backend.

## 5. Stripe webhook

Stripe dashboard → Developers → Webhooks → add `https://<backend>.vercel.app/api/payments/webhook`, events `payment_intent.succeeded` and `payment_intent.payment_failed`. Put the signing secret in `STRIPE_WEBHOOK_SECRET` and redeploy.

## 6. Smoke test

- Home page lists products with images.
- Register / log in; add to cart; pay with card `4242 4242 4242 4242`.
- Log in as the admin: an **Admin** link appears; add a product with an image.
- Open the "Ask AI" button and search for something.

## Free-tier notes

TiDB Starter: 5 GiB / 50M request units. Upstash: 500K commands per month. Gemini: limited requests per day (the app caps AI use per IP and globally). Vercel functions have cold starts, so the first request after idle can be slow.
