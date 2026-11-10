# LinkStore – Product Requirements

## Vision
Turn social-media traffic (WhatsApp, Instagram, TikTok) into trustworthy, fast, mobile-first storefronts for Nigerian merchants – with payments that are correct by construction.

## Users
- **Merchant** (non-technical social seller): creates a store link, lists products, ships orders, gets paid.
- **Shopper**: arrives from a social link on a modest phone/network, wants to see price, pay safely, and know where the order is.

## Problems
Selling through DMs is slow and error-prone: manual prices, screenshots as proof of payment, no order tracking, no stock control, buyer distrust.

## Primary journeys
1. Merchant signs up → creates store (link) → adds payout details → adds products (variants, media, stock) → shares link.
2. Shopper opens storefront → browses/searches → adds to cart → checks out → pays on Paystack → sees confirmation → tracks order.
3. Merchant sees a paid order → marks shipped → shopper/merchant confirm delivery (dual confirmation) → shopper may review or dispute.
4. Shopper asks the store assistant about products/delivery/order status.

## Functional requirements
- Storefront: products, variants, availability, search, cart, delivery area fees, announcements.
- Checkout: server-computed prices; unpaid/underpaid orders are never shown as paid; double-submit safe.
- Payments: Paystack with subaccount split; verified server-side; webhook-driven; reconciled by a scheduled job.
- Orders: PENDING → PAID → SHIPPED → DELIVERED (+ CANCELLED/REFUNDED); only verified payment can set PAID.
- Merchant dashboard: overview, products, orders, reviews, analytics, settings.
- Shopper chatbot: grounded answers from live store data, product cards with Add to cart, checkout handoff, order status after verification; read-only.
- Merchant assistant: sales/orders/stock questions and a confirm-to-act "mark shipped" proposal; read-only otherwise.
- Refunds: merchant requests, platform admin approves, Paystack executes; admin payments & reconciliation page.

## Business rules
- Currency NGN; amounts integer kobo; max order ₦10,000,000.
- Platform commission default 5% (per-store `commissionPercentage`), rounded half-up; merchant receives remainder.
- Stores must have payout details to accept payments (default).
- Reviews only for delivered orders that contained the product; one per order+product.
- Chat history retained 30 days.

## Non-functional requirements
Mobile-first, light-only UI, accessible (labels, focus, reduced motion), fast on slow networks, no secrets/PII in logs, additive migrations, idempotent money operations.

## Success metrics
Checkout→paid conversion; % orders with verified payment (target 100%); payment mismatches (target 0, alert on >0); webhook failure rate; time-to-ship; chat answer helpfulness (manual review) and order-lookup denial rate; storefront LCP on 4G.

## Out of scope (currently)
Assistant placing orders or taking payment on its own (it adds to cart and hands off to checkout); verified-against-live settlement reconciliation and alerting; multi-currency; marketplace/multi-store carts; SMS/WhatsApp notifications (listed on the old roadmap, not built); dark mode (intentionally removed).
