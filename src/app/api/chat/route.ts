import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { messages, storeId } = await req.json();

        if (!storeId) {
            return new Response('Store ID is required', { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store: any = await (prisma.store.findUnique as any)({
            where: { id: storeId },
            include: {
                products: {
                    where: { inStock: true },
                    include: { variants: true, media: true }
                }
            }
        });

        if (!store) {
            return new Response('Store not found', { status: 404 });
        }

        // Format the inventory into a readable string for the AI's system prompt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inventoryContext = (store.products as any[]).map((p: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasVideo = p.media?.some((m: any) => m.type === "VIDEO");
            const mediaCount = p.media?.length || 0;
            
            let desc = `- ${p.name}: ₦${Number(p.price).toLocaleString()} (${p.description || "No description"})`;
            if (hasVideo) desc += " [HAS VIDEO PREVIEW]";
            if (mediaCount > 1) desc += ` [GALLERY: ${mediaCount} photos]`;

            if (p.variants && p.variants.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                desc += `\n  Variants: ${p.variants.map((v: any) => `${v.name} (₦${Number(v.price || p.price).toLocaleString()})`).join(', ')}`;
            }
            return desc;
        }).join('\n');

        const systemPrompt = `
You are a helpful, professional, and friendly virtual store assistant for "${store.name}".
Your goal is to answer customer questions about the store's products, help them find what they need, and encourage them to make a purchase.
You should act as if you *work* at ${store.name}. Use a polite, slightly enthusiastic tone.

LOCAL CONTEXT:
- You are serving customers primarily in Nigeria.
- If a user uses local slang like "How far?", "Abeg", or "Oga", respond professionally but acknowledge the friendly tone.
- When talking about prices, use the "₦" symbol (e.g., ₦5,000).

ORDER TRACKING VIBE:
- If a user asks about their order, ALWAYS ask for their **Order ID** AND either their **Email** or **Phone Number** linked to the order.
- You have a tool called "get_order_status" to fetch this data. Do NOT use it until you have both pieces of information.
- Be empathetic if an order is PENDING or delayed.

INVENTORY:
${inventoryContext || "The store appears to have no products in stock right now."}

RULES:
1. ONLY answer questions about the products listed above or general shopping queries (e.g., shipping, policies usually handled by simply telling them to proceed to checkout).
2. If the user asks for something that is NOT in the inventory above, say: "I don't have that in stock right now, but feel free to check out our other great items!"
3. KEEP ANSWERS SHORT: People are on mobile. Avoid long paragraphs. Use bullet points if listing more than 2 items.
4. **VIDEO/MEDIA**: If a product has "[HAS VIDEO PREVIEW]", encourage them to "click the product to watch the video". If it has "[GALLERY]", tell them they can "swipe to see more angles".
5. **CHECKOUT**: When they want to buy, tell them to "Click the 'Add to Cart' button" on the product card. Mention they can then go to the "Checkout" page to finish.
6. **LAST PRICE**: If they ask for a discount or "last price", politely explain that the prices are fixed to ensure the best quality, but they are getting a great deal.
`;

        const result = await streamText({
            // @ts-expect-error - suppress LanguageModel interface mismatch between core and provider packages
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            messages,
            maxSteps: 5,
            tools: {
                get_order_status: {
                    description: 'Get the current status and items of an order. Requires Order ID and verification (email or phone).',
                    parameters: z.object({
                        orderId: z.string().describe('The full order ID from the customer.'),
                        verification: z.string().describe('The email or phone number provided by the customer for verification.'),
                    }),
                    execute: async ({ orderId, verification }) => {
                        try {
                            const order = await prisma.order.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: {
                                        include: { product: true }
                                    }
                                }
                            });

                            if (!order) return { error: "Order not found." };
                            if (order.storeId !== storeId) return { error: "Order not found." };

                            // Verify email or phone
                            const isEmailMatch = order.customerEmail.toLowerCase() === verification.toLowerCase();
                            const isPhoneMatch = order.customerPhone.replace(/\D/g, '').includes(verification.replace(/\D/g, '')) || verification.replace(/\D/g, '').includes(order.customerPhone.replace(/\D/g, ''));
                            
                            if (!isEmailMatch && !isPhoneMatch) {
                                return { error: "Verification failed. The email or phone does not match this order." };
                            }

                            return {
                                status: order.status,
                                items: order.items.map(i => `${i.quantity}x ${i.product.name}`),
                                total: Number(order.total),
                                createdAt: order.createdAt,
                                updatedAt: order.updatedAt,
                            };
                        } catch (err) {
                            console.error("TOOL_ERROR:", err);
                            return { error: "Could not retrieve order details." };
                        }
                    }
                }
            }
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error("AI_CHAT_ERROR:", error);
        return new Response('An error occurred during chat.', { status: 500 });
    }
}
