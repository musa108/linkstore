import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, storeId } = await req.json();

        if (!storeId) {
            return new Response('Store ID is required', { status: 400 });
        }

        // Fetch the store and its products
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: {
                products: {
                    where: { inStock: true },
                    include: { variants: true }
                }
            }
        });

        if (!store) {
            return new Response('Store not found', { status: 404 });
        }

        // Format the inventory into a readable string for the AI's system prompt
        const inventoryContext = store.products.map(p => {
            let desc = `- ${p.name}: ₦${Number(p.price).toLocaleString()} (${p.description || "No description"})`;
            if (p.variants && p.variants.length > 0) {
                desc += `\n  Variants: ${p.variants.map(v => `${v.name} (₦${Number(v.price || p.price).toLocaleString()})`).join(', ')}`;
            }
            return desc;
        }).join('\n');

        const systemPrompt = `
You are a helpful, professional, and friendly virtual store assistant for "${store.name}".
Your goal is to answer customer questions about the store's products, help them find what they need, and encourage them to make a purchase.
You should act as if you *work* at ${store.name}. Use a polite, slightly enthusiastic tone, but keep your answers incredibly short, concise, and easy to read on mobile. Avoid long paragraphs.

Here is the current active inventory available in the store:
${inventoryContext || "The store appears to have no products in stock right now."}

Rules:
1. ONLY answer questions about the products listed above or general shopping queries (e.g., shipping, policies usually handled by simply telling them to proceed to checkout).
2. If the user asks for something that is NOT in the inventory above, apologize and say you don't carry it right now.
3. If they ask about prices, always format the Nigerian Naira nicely like ₦5,000.
4. When they are ready to buy, simply instruct them to click the "Add to Cart" button on the product card or search for the item on the page. Do not promise to add it to their cart for them, as you just guide them.
`;

        const result = await streamText({
            model: openai('gpt-4o-mini'),
            system: systemPrompt,
            messages,
        });

        return result.toAIStreamResponse();
    } catch (error) {
        console.error("AI_CHAT_ERROR:", error);
        return new Response('An error occurred during chat.', { status: 500 });
    }
}
