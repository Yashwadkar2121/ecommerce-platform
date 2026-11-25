# E-Commerce Platform

A full-stack online store: browse a 10,000-product catalogue, pay with Stripe, manage products with image uploads as an admin, and get help from an AI shopping assistant.

**Stack:** React 19 · Redux Toolkit · Vite · Tailwind 4 | Node.js · Express 5 | MongoDB Atlas (catalogue, reviews) · MySQL-compatible TiDB Cloud (users, orders, payments) · Redis (cart, cache) | Stripe · Cloudinary · Google Gemini

## Features

- **Catalogue at scale** - 10K products, server-side search, filters, sorting and pagination. Compound MongoDB indexes, slim list payloads, Redis caching and resized images keep lists fast.
- **Checkout with Stripe** - server-calculated prices and tax (the client never sets a price), stock reserved when an order is created, webhook confirms payment.
- **Cart** - stored in Redis, synced across devices after login.
- **Orders** - order history, cancellation of unpaid orders.
- **Admin product manager** (`/admin/products`) - create, edit, hide and delete products; upload up to 5 images straight to Cloudinary using server-signed uploads.
- **AI features (Gemini)**
  - Shopping assistant: turns a sentence such as "running shoes under $60" into validated search filters. The model never talks to the database; its output is checked against allow-lists before use.
  - "Write with AI" for product descriptions in the admin form.
  - Review summaries (pros / cons) on product pages, cached for 24 hours.
  - Per-IP and global daily limits protect the free quota.
- **Security** - helmet, CORS allow-list, rate limits on API and auth routes, JWT auth, field allow-lists on admin writes, TLS to the SQL database.

## Architecture

```
React (Vercel) ──► Express API (Vercel serverless)
                     ├─ MongoDB Atlas : products, reviews
                     ├─ TiDB Cloud    : users, orders, payments (Sequelize)
                     ├─ Upstash Redis : cart, product cache, AI rate limits
                     ├─ Stripe        : payments + webhook
                     ├─ Cloudinary    : image storage (browser uploads directly)
                     └─ Gemini        : assistant, descriptions, review summaries
```

The Express app is exported (`module.exports = app`) and connects to each database lazily, once per instance, so it runs both locally and as a serverless function.

## Run locally

Requirements: Node 20+, and either local MongoDB/MySQL/Redis or free cloud instances (see [DEPLOYMENT.md](DEPLOYMENT.md)).

```bash
cd backend
cp .env.example .env        # fill in the values
npm install
npm run db:sync             # create SQL tables
npm run seed                # 10,000 products + sample reviews (npm run seed:reset to start over)
npm run admin:create -- --email=you@example.com --password='ChangeMe123!'
npm run dev                 # http://localhost:5000

cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Useful seed options: `--count=2000`, `--reviews=300`, `--skip-verify`.

## Tests

```bash
cd backend && npm test
```

Covers pricing, seed data generation and the AI filter sanitising. CI runs the backend tests and a frontend build on every push.

## Deploy

Everything runs on free tiers. Step by step guide: [DEPLOYMENT.md](DEPLOYMENT.md).

## Known limitations

- Unpaid orders keep their stock reserved until cancelled; a scheduled cleanup job is the next step.
- PayPal is wired in the backend but has no frontend yet.
- Money columns use `FLOAT`; `DECIMAL` would be better for a real shop.
