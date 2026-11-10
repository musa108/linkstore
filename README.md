# LinkStore

A link-in-bio storefront for Nigerian social-media merchants: one shareable URL per store, products with variants and stock, Paystack checkout with split payments, order tracking with dual delivery confirmation, a merchant dashboard, and a store-scoped shopping assistant.

> Docs: [`PRD.md`](PRD.md) · [`Architecture.md`](Architecture.md) · [`Architecture_essential.md`](Architecture_essential.md) (rules every contributor/agent must follow) · [`Agents.md`](Agents.md) · [`Claude.md`](Claude.md)

## What actually exists
- Public storefronts at `/<slug>`, cart, checkout, success/track pages, reviews (delivered orders only), disputes.
- Payments: server-priced checkout → Paystack → **verified** (amount + currency + reference) via webhook, redirect page and a reconcile cron. Idempotent. Commission is recorded per payment in kobo.
- Dashboard: overview, products (variants, media, stock), orders (ship, confirm delivery), reviews, analytics, settings/payout setup.
- Shopper assistant (OpenAI via Vercel AI SDK v6): searches **this store's** live catalogue, shows product cards with *Add to cart*, hands off to checkout, and checks order status after the shopper supplies the order ID + checkout email/phone. Read-only.
- Merchant assistant (dashboard): sales, orders and stock Q&A; proposes "mark as shipped" which you confirm with a button.
- Refunds: merchants request, a platform admin approves (set `ADMIN_USER_IDS`), Paystack executes. Admin page: `/dashboard/admin/payments` (ledger reconciliation, refund queue, settlement comparison).
- Not built: WhatsApp notifications and pushed inventory alerts (low stock shows in the dashboard), dark mode (removed on purpose), alerting for reconciliation findings.
- Design system: see [`DESIGN.md`](DESIGN.md).

## Stack
Next.js 15 · React 19 · Tailwind 4 · Prisma 7 (+`pg` adapter) · PostgreSQL · Clerk · Paystack · Vercel AI SDK 6 · Cloudinary · Vitest.

## Setup
```bash
git clone <your-fork-url> && cd linkstore
npm install
cp .env.example .env        # fill in values (see comments)
npm run db:deploy           # applies prisma/migrations to an EMPTY database (3 migrations)
npm run dev
```
**Existing database created with `prisma db push`?** Run once: `npm run db:baseline` (marks `0_init` as applied), then `npm run db:deploy`. Before deploying, run the pre-flight query at the top of `prisma/migrations/20261016000000_payments_chat_integrity/migration.sql` (duplicate reviews would block a unique index).

### Paystack
Set the webhook URL in the Paystack dashboard to `https://<your-domain>/api/webhooks/paystack`. The same secret key is used to verify signatures. Use test keys until you have completed a test purchase end-to-end.

### Scheduled job
`vercel.json` calls `/api/cron/maintenance` every 15 minutes (needs `CRON_SECRET`; Vercel Hobby limits cron frequency). It reconciles missed webhooks, expires abandoned payments, cancels stale unpaid orders and prunes chat history older than 30 days.

## Scripts
| Command | Purpose |
|---|---|
| `npm run typecheck` / `npm run lint` | static checks |
| `npm test` | unit tests (+ integration if `TEST_DATABASE_URL` points to a **disposable** Postgres) |
| `npm run test:db` | start a throwaway Postgres, run everything, tear it down |
| `npm run db:verify-migrations` | apply all migrations to a disposable DB, check backfill + schema drift |
| `npm run db:deploy` | `prisma migrate deploy` (production release step) |

## Health & ops
`GET /api/health` → `{ ok, database, env, openai }` (names only, no values). Logs are structured JSON with sensitive keys redacted.

## Security notes
Prices, totals, fees and roles are never accepted from the browser. Merchant actions require ownership of the target store/product/order. See `Architecture.md §5`.
