export interface Store {
    id: string;
    vendorId: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    primaryColor: string;
    announcement: string | null;
    islandDeliveryFee: number | string | { toString(): string }; // Decimal
    mainlandDeliveryFee: number | string | { toString(): string };
    visits: number;
    conversionClicks: number;
    phoneNumber: string | null;
    lowStockThreshold: number;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    subaccountCode: string | null;
    commissionPercentage: number | string | { toString(): string } | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Variant {
    id: string;
    productId: string;
    name: string;
    sku: string | null;
    price: number | string | { toString(): string } | null;
    stockCount: number;
    lowStockThreshold: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    storeId: string;
    name: string;
    description: string | null;
    price: number | string | { toString(): string }; // Decimal
    imageUrl: string | null;
    inStock: boolean;
    views: number;
    lowStockThreshold: number | null;
    variants?: Variant[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Order {
    id: string;
    storeId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    deliveryArea: string;
    deliveryFee: number | string | { toString(): string }; // Decimal
    subtotal: number | string | { toString(): string }; // Decimal
    total: number | string | { toString(): string }; // Decimal
    status: string;
    paystackReference: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    priceAtPurchase: number | string | { toString(): string }; // Decimal
    createdAt: Date;
}

export type StoreWithProducts = Store & {
    products: Product[];
};

export type OrderWithItems = Order & {
    items: (OrderItem & {
        product: Product;
        variant?: Variant | null;
    })[];
};

export interface CartItem {
    id: string; // product id
    variantId?: string;
    variantName?: string;
    name: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
}

export interface Bank {
    id?: number;
    name: string;
    slug?: string;
    code: string;
    longcode?: string;
    gateway?: string | null;
    pay_with_bank?: boolean;
    active?: boolean;
    is_deleted?: boolean;
    country?: string;
    currency?: string;
    type?: string;
    createdAt?: string;
    updatedAt?: string;
}
