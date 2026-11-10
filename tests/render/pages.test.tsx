// Server-render smoke tests: every redesigned surface renders without throwing and contains its key content.
// (This is NOT a visual check – nothing here proves layout/appearance; see Architecture.md §9.)
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ push: () => undefined }), redirect: () => undefined, notFound: () => undefined }));
vi.mock("@/lib/actions/store", () => ({ trackConversion: async () => undefined, trackVisit: async () => undefined }));
vi.mock("@/lib/actions/product", () => ({ trackProductView: async () => undefined }));
vi.mock("@/lib/actions/order", () => ({ updateOrderStatus: async () => ({}), confirmOrderDelivery: async () => ({}) }));
vi.mock("@/lib/actions/payments-admin", () => ({ requestOrderRefund: async () => ({}), decideRefundAction: async () => ({}), runSettlementReport: async () => ({ rows: [] }) }));
vi.mock("@/server/auth", () => ({ isAdminUserId: () => false }));
vi.mock("recharts", () => { const P = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>; return { ResponsiveContainer: P, AreaChart: P, Area: P, XAxis: P, YAxis: P, CartesianGrid: P, Tooltip: P }; });

const store = { id: "s1abcdefghij", vendorId: "v", name: "Zainab's Closet", slug: "zainab", description: "Lagos fashion", logoUrl: null, primaryColor: "#4f46e5", announcement: "Free delivery over ₦50,000", islandDeliveryFee: 2500, mainlandDeliveryFee: 1500, visits: 10, conversionClicks: 3, phoneNumber: "08012345678", lowStockThreshold: 5, bankName: null, accountNumber: null, accountName: null, subaccountCode: null, commissionPercentage: null, createdAt: new Date(), updatedAt: new Date() };
const products = [
    { id: "p1abcdefghij", storeId: "s1abcdefghij", name: "Ankara wrap dress", description: "Bright", price: 18500, imageUrl: null, inStock: true, views: 0, lowStockThreshold: null, variants: [{ id: "v1", productId: "p1", name: "M", sku: null, price: null, stockCount: 3, lowStockThreshold: null, createdAt: new Date(), updatedAt: new Date() }], media: [], reviews: [{ id: "r1", productId: "p1", orderId: "o", customerName: "Ada Obi", rating: 5, comment: "Love it", createdAt: new Date() }], createdAt: new Date(), updatedAt: new Date() },
    { id: "p2abcdefghij", storeId: "s1abcdefghij", name: "Shea butter", description: null, price: 4500, imageUrl: null, inStock: true, views: 0, lowStockThreshold: null, variants: [], media: [], reviews: [], createdAt: new Date(), updatedAt: new Date() },
];

describe("render smoke", () => {
    it("landing page", async () => {
        const { default: Landing } = await import("@/app/page");
        const html = renderToString(await Landing());
        for (const t of ["One link that turns followers", "Create your store", "How it works", "5%", "Questions sellers ask first"]) expect(html).toContain(t);
        expect(html).not.toMatch(/dark:|bg-black|bg-gray/);
        expect((html.match(/<h1/g) ?? []).length).toBe(1);
    });
    it("storefront: grid, prices, announcement, search label, assistant", async () => {
        const { default: Storefront } = await import("@/app/[slug]/client-storefront");
        const html = renderToString(<Storefront store={store as never} products={products as never} />);
        for (const t of ["Zainab&#x27;s Closet", "Ankara wrap dress", "Shea butter", "Add to cart", "Choose option", "Free delivery over", "Chat on WhatsApp", "Search products"]) expect(html).toContain(t);
        expect(html).toContain("₦18,500"); // priced from the variant/base price
    });
    it("storefront empty state", async () => {
        const { default: Storefront } = await import("@/app/[slug]/client-storefront");
        expect(renderToString(<Storefront store={store as never} products={[]} />)).toContain("No products yet");
    });
    it("dashboard overview: share card, checklist, KPIs, empty orders", async () => {
        const { default: Overview } = await import("@/app/dashboard/dashboard-overview");
        const html = renderToString(<Overview data={{ store: { name: "Zainab", slug: "zainab", visits: 0, conversionClicks: 0, hasPayout: false }, chart: [], revenue7d: 0, productCount: 0, toShip: 0, recent: [], lowStock: [] }} />);
        for (const t of ["Your store link", "Finish setting up", "Add your first product", "Add payout details", "Revenue (7 days)", "No orders yet"]) expect(html).toContain(t);
    });
    it("order list: filters, empty state and a populated order", async () => {
        const { default: OrderList } = await import("@/app/dashboard/orders/order-list");
        expect(renderToString(<OrderList orders={[]} />)).toContain("No orders yet");
        const o = { id: "ord123456abc", customerName: "Bola A", customerPhone: "0801", address: "1 Road", deliveryArea: "MAINLAND", total: 11500, deliveryFee: 1500, status: "PAID", isDisputed: false, disputeReason: null, vendorConfirmedDelivery: false, customerConfirmedDelivery: false, createdAt: new Date().toISOString(), items: [{ id: "i", quantity: 1, priceAtPurchase: 10000, product: { name: "Dress", imageUrl: null }, variant: null }], payments: [] };
        const html = renderToString(<OrderList orders={[o]} />);
        for (const t of ["To ship", "Bola A", "Paid – ready to ship", "1× Dress", "₦11,500"]) expect(html).toContain(t);
    });
});
