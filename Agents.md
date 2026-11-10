# Agents.md – working in this repository

Applies to any coding agent or contributor. Read `Architecture_essential.md` first, then `Architecture.md` for detail.

## Navigation
- Business rules → `src/domain/*` (pure, unit-tested). Use-cases → `src/server/*`. Server actions (thin, validated, authorised) → `src/lib/actions/*`.
- Payments: `src/server/checkout.ts` → `src/server/payments/finalize.ts` ← `webhook.ts` / `verify/page.tsx` / `maintenance.ts`.
- Chatbots: shopper `src/app/api/chat/route.ts` + `src/server/chat/{tools,messages,prompt}.ts` + `components/chat/chat-widget.tsx`; merchant `src/app/api/merchant-chat/route.ts` + `src/server/chat/merchant-tools.ts` + `components/chat/merchant-assistant.tsx`.
- Refunds & reconciliation: `src/server/payments/refunds.ts`, `src/server/reconciliation.ts`, admin UI `src/app/dashboard/admin/payments`.
- Visual system: `DESIGN.md` + tokens in `src/app/globals.css`.
- Schema: `prisma/schema.prisma` + `prisma/migrations/*`.

## Conventions
- TypeScript strict; no new `any` (use `unknown` + zod). Validate every untrusted input with zod at the boundary.
- Server actions: authorise first (`src/server/auth.ts`), validate, act, return `{ error }` / data. Never throw raw errors to the client; log with `logger` (structured, redacted).
- Money: kobo integers via `src/domain/money.ts`. No float arithmetic.
- Styling: Tailwind + tokens from `globals.css`. Light theme only; no dark/grey backgrounds. Respect `prefers-reduced-motion`.
- Keep route handlers and components thin; no business rules in JSX.

## Task execution rules
1. Inspect before editing; keep changes small and reviewable. Preserve unrelated user changes.
2. Behaviour change ⇒ add/update tests **and** docs in the same change. Architectural decision ⇒ update `Architecture.md` (and `Architecture_essential.md` if an invariant changes).
3. Schema change ⇒ new additive migration folder; run `npm run db:verify-migrations`; document rollback.
4. Never claim a command/test/build passed unless you ran it and read the result.
5. Never weaken auth, validation or signature checks to make a test pass.
6. Never run destructive DB commands against an unknown/production database. Tests refuse URLs containing "prod".
7. Never initiate real payments in tests; inject `verify`/`initialize` fakes (see `tests/integration/payments.test.ts`).

## Definition of done for a change
`npm run typecheck` · `npm run lint` (no new warnings) · `npm run test:db` · `next build` · docs updated.

## Review checklist
Ownership check present? Price/total derived on the server? Idempotent under retry/duplicate? Error message leaks nothing? New public endpoint rate-limited? New table has indexes + FKs? Mobile + keyboard + reduced-motion checked?
