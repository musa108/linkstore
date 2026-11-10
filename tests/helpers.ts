import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

export const hasDb = Boolean(process.env.TEST_DATABASE_URL);
let db: PrismaClient | undefined;
export function testDb(): PrismaClient {
    if (!db) db = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 5 })) });
    return db;
}
const uid = () => randomUUID().replaceAll("-", "").slice(0, 12);

export async function seedMerchant(opts: { commission?: string; subaccount?: boolean } = {}) {
    const d = testDb(); const id = uid();
    const store = await d.store.create({ data: { vendorId: `user_${id}`, name: `Store ${id}`, slug: `store-${id}`, subaccountCode: opts.subaccount === false ? null : `ACCT_${id}`, commissionPercentage: opts.commission ?? "5.0", mainlandDeliveryFee: "1500", islandDeliveryFee: "2500" } });
    const product = await d.product.create({ data: { storeId: store.id, name: "Ankara Dress", description: "Colourful", price: "10000", inStock: true } });
    const variant = await d.variant.create({ data: { productId: product.id, name: "Size M", stockCount: 5 } });
    return { store, product, variant };
}
