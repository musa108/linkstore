# DESIGN.md – LinkStore visual system

> Scope: marketing landing page, public storefront, merchant dashboard, chat widgets. Light theme only.
> **Reference note:** the style targets named by the product owner (drocsid.app, normandyos.vercel.app) could not be
> retrieved while this was written, so this system is derived from the owner's stated rules plus the existing brand
> (indigo). When screenshots/tokens of those sites are available, adjust the tokens below – every colour/radius lives in
> `src/app/globals.css`, so a restyle is a token change, not a rewrite.

## Principles
1. **Commerce first, console second.** A shopper sees product, price, and "how do I buy" within one screen on a phone.
2. **Warm, confident, quiet.** Paper-like canvas, ink text, one brand colour. No gradients-for-decoration, no glass, no dark/grey surfaces.
3. **Mobile first.** 44 px touch targets, thumb-reachable primary actions, no horizontal scroll, works on slow networks (no hero video, no heavy JS on the landing page).
4. **Motion explains state** (cart opens, item added). Everything respects `prefers-reduced-motion`.
5. **Honest UI.** Sample content is labelled "sample"; no invented statistics or testimonials.

## Tokens (see `globals.css`)
| Token | Value | Use |
|---|---|---|
| `--canvas` | `#fbf8f2` | page background |
| `--background` / `--card` | `#ffffff` | cards, sheets, inputs |
| `--secondary` | `#f7f2e8` | quiet fills, chips (warm cream – never grey) |
| `--border` | `#e8e0d0` | hairlines |
| `--foreground` | `#1c1917` | text (warm ink) |
| `--primary` | `#4f46e5` | CTAs, links, focus |
| store `primaryColor` | merchant-defined | storefront accents only |
| status | emerald (paid/delivered), amber (awaiting), indigo (shipped), red (problem) | badges, always paired with text |

Typography: Geist (sans). Display 600–800, tight tracking (-0.02em); body 16 px / 1.6; numbers (prices) tabular.
Radius: 12 (inputs/buttons), 20 (cards), 28 (sheets/hero panels). Elevation: hairline border + one soft shadow; hover lifts 1 px.
Spacing: 4-px base; section rhythm 80–112 px desktop, 56–72 px mobile.
Contrast: body text ≥ 7:1; muted text never below 4.5:1 (use `text-foreground/70`, not lighter, for content).

## Patterns
- **Landing:** nav → hero (promise + sample storefront preview) → how it works (3 steps) → capabilities → fees → FAQ → CTA. One primary CTA per viewport.
- **Storefront:** sticky header (logo, search, cart) → announcement → store intro → product grid (2 cols mobile, 3–4 desktop) → product sheet → cart drawer → floating assistant. Primary buy action always visible without scrolling in the sheet.
- **Dashboard:** left rail (desktop) / bottom tabs (mobile); overview = share link + setup checklist + 4 KPIs + sales chart + recent orders; every list has an empty state that tells the merchant what to do next.
- **Assistant:** bottom-right bubble, never covers the cart/checkout button (offsets above the mobile cart bar); product cards inside answers with real "Add to cart".

## Accessibility checklist
Labels on every input · visible focus ring · dialogs trap focus and close on Esc · icons have text or `aria-label` · status never by colour alone · live regions for chat and toasts · reduced-motion respected.
