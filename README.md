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

## Product flow

Problem → Diagnose → Price → Pay → Case → Communicate → Resolve

The homepage composer is the product. Cases are the workspace. Resolution reports are the deliverable.
