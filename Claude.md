# Claude.md – instructions for Claude Code

Authoritative docs (read in this order): `Architecture_essential.md` → `Agents.md` → `Architecture.md` → `PRD.md`.

## Must-follow
- Money = integer kobo. The client never supplies prices/totals/roles. Only `finalize.ts` can mark a payment/order paid.
- Authorise by ownership using `src/server/auth.ts`; return identical errors for "missing" and "not yours".
- `"use server"` modules export only async functions.
- Chatbot tools stay read-only, store-scoped, allowlisted; order lookups need id + email/phone and are rate-limited.
- UI is light-only (no dark/grey backgrounds). Match the quality of https://drocsid.app/ and https://normandyos.vercel.app/ for any new landing/marketing page, using a per-repo `DESIGN.md` if one exists.
- Additive migrations only; never `db push`/reset a real database.

## Workflow
Inspect → small change → tests (`npm run test:db`) → `npm run typecheck && npm run lint` → `next build` → update docs. Report only what you actually ran. If you change an architectural decision, update `Architecture.md`/`Architecture_essential.md` in the same change.

## Sandbox notes
`prisma generate` needs `binaries.prisma.sh`; in network-restricted sandboxes set `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true` (generate only; never for migrations). `next build` fetches Google Fonts; offline builds need the font import stubbed.
