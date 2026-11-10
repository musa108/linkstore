# LinkStore – Essential Rules (read before changing anything)

Authoritative detail lives in `Architecture.md`. This page is the short list of things you must not break.

## Stack
Next.js 15 (App Router, server actions) · React 19 · Tailwind 4 · Prisma 7 + `@prisma/adapter-pg` on PostgreSQL · Clerk (auth) · Paystack (payments) · Vercel AI SDK **v6** + OpenAI (chatbot) · Vitest.

## Invariants
1. **Money is integer kobo** in all arithmetic (`src/domain/money.ts`). DB `Decimal` columns are exact; convert only at the boundary with `toKobo`/`fromKobo`. Never use float math on money.
2. **The client never supplies a price, total, fee, commission, payment status or role.** Checkout accepts ids + quantities only; `src/server/checkout.ts` prices from DB rows via `src/domain/pricing.ts`.
3. **Only `src/server/payments/finalize.ts` may mark a Payment SUCCESS / an Order PAID.** It re-verifies with Paystack and compares amount + currency + reference. Browser redirects and webhook payloads are never trusted on their own.
4. **Every payment effect is idempotent** (conditional `updateMany` guards + unique `PaymentEvent.eventKey`). Stock is decremented exactly once, when an order flips PENDING/CANCELLED → PAID.
5. **Webhooks**: verify `x-paystack-signature` (HMAC-SHA512 of the RAW body) before parsing; return 5xx only for retryable failures.
6. **Authorization is ownership, not login.** Use `src/server/auth.ts` (`requireOwnedStoreById/Product/Order`, `requireStore`). Missing and not-yours return the same "Not found".
7. **Order fulfilment transitions** live in `src/domain/order-state.ts`. Merchants may only set `SHIPPED`. Delivery-confirm role is derived server-side.
8. **Chatbot**: shopper-context only; read-only allowlisted tools; store comes from the server, never the model; order lookup needs order id + matching email/phone and is rate-limited; client-sent `system`/tool messages are discarded (`src/server/chat/messages.ts`).
9. **`"use server"` files may export only async functions** (the build fails otherwise). Put schemas/constants in non-action modules.
10. **Migrations are additive** and live in `prisma/migrations`. Never `db push` against production. Never reset/drop prod data.
11. **UI is light-only**: no dark or grey backgrounds. Use tokens in `src/app/globals.css` (warm cream/white). No `dark:` variants, no `bg-gray/zinc/slate/black`.
12. **Refunds**: merchants request, platform admins (`ADMIN_USER_IDS`) approve; only `src/server/payments/refunds.ts` talks to Paystack's refund API. Never refund on an ambiguous provider timeout without checking Paystack first.
13. **Assistants never mutate**: tools are read-only; actions are *proposals* confirmed by a UI button that calls the normal authorised server action. Merchant-assistant tools send no customer contact details to the model.
14. **Rate limiting** goes through `rateLimit()` (async, Postgres-backed). Always `await` it.
15. Secrets stay server-side; never log secrets/PII (the logger redacts sensitive keys; don't rely on it).

## Layout
```
src/domain/    pure rules (money, pricing, order-state) – no I/O
src/server/    use-cases: checkout, payments/{finalize,webhook}, maintenance, chat/*, auth helpers
src/lib/       adapters & utils: prisma, paystack, env, logger, rate-limit, actions/* (thin server actions)
src/app/       routes (UI + API handlers – keep thin)
tests/         unit/ (pure), integration/ (real Postgres)
```
Dependency direction: `app → lib/actions → server → domain`; `domain` imports nothing from the app.

## Commands
```
npm run typecheck | npm run lint | npm test            # unit (+ integration if TEST_DATABASE_URL set)
npm run test:db                                        # spins a disposable Postgres and runs everything
npm run db:verify-migrations                           # TEST_DATABASE_URL=… applies migrations + drift check
npm run db:deploy                                      # prisma migrate deploy (production release step)
```
Existing production DB (created by `db push`): run `npm run db:baseline` ONCE, then `npm run db:deploy`.

## Known limits (do not paper over)
Rate limiter costs one DB round-trip per check; stock is checked at checkout but only decremented on payment (no reservation); the Paystack `/settlement` comparison is informational and unverified against a live account; no automatic alerting (findings show in the admin page/logs).
