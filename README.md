# Ecom Resolutions

Productized e-commerce problem resolution for Amazon, Walmart, Shopify, Google Merchant Center, and TikTok Shop.

**E-commerce problems. Resolved.**

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Auth.js (email/password + Google)
- Stripe Checkout
- OpenAI intake (heuristic fallback when no API key)
- Local disk or S3-compatible file storage
- Resend-compatible transactional email

## Local setup

1. Copy `.env.example` to `.env` and fill values.
2. Start Postgres (`docker compose up -d` or local PostgreSQL).
3. Install and migrate:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Seeded staff accounts are created only when `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and optional expert variables are set. Do not commit real credentials.

Without `STRIPE_SECRET_KEY`, development checkout records a real payment row and opens the case. Production requires Stripe.

Without `OPENAI_API_KEY`, intake uses catalog-aware heuristic classification. All AI calls remain server-side.

## Deploy on Hostinger (Node.js web app)

This is a **Next.js + PostgreSQL** app. It will not run as a static site in `public_html`. A **403 Forbidden** after deploy almost always means Hostinger is treating the repo as files on disk (no `index.html`) instead of a running Node process, or the generated `public_html/.htaccess` proxy is stale.

1. In hPanel: **Websites → Add Website → Node.js web app** (Business or Cloud plans). Do **not** use “Git website” / static file deploy into `public_html`.
2. Import this GitHub repo. Select the branch that contains the app (not an empty `main` if the product still lives on a feature branch).
3. Confirm settings:
   - **Framework:** Next.js (server)
   - **Node.js:** 20
   - **Build command:** `npm run build`
   - **Start command:** `npm start` (runs `server.js`)
   - **Entry file:** `server.js`
   - **Output directory:** `.next`
4. Set environment variables before the first successful start:
   - `DATABASE_URL` (Postgres; Hostinger’s one-click wizard is Supabase/Mongo only — use Hostinger PostgreSQL, Neon, or Supabase **with the Postgres connection string**, not the anon key)
   - `AUTH_SECRET` / `NEXTAUTH_SECRET` (long random string)
   - `AUTH_URL` / `NEXTAUTH_URL` = `https://your-domain` (no trailing slash)
5. After build: `npx prisma migrate deploy` and `npm run db:seed` (SSH, or a one-off job). Then **Restart** the Node app.
6. If the site still shows **403**, Hostinger’s own docs: the `.htaccess` in `public_html` is stale or was edited. **Redeploy** so Hostinger regenerates it. Do not commit or hand-edit that file.
7. If GitHub import itself returns **403**, the Hostinger GitHub App cannot read the repo — grant access, or make the repo public for the import.

Shared hosting / `public_html` FTP uploads cannot run this product.

## Product flow

Problem → Diagnose → Price → Pay → Case → Communicate → Resolve

The homepage composer is the product. Cases are the workspace. Resolution reports are the deliverable.
