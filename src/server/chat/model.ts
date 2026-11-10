import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

/**
 * Returns the configured LanguageModel.
 * Prefers Google Gemini via the native @ai-sdk/google provider (not the OpenAI-compat shim,
 * which produces non-standard tool-call response shapes that trip the AI SDK type validator).
 * Falls back to OpenAI if OPENAI_API_KEY is configured.
 */
export function getChatModel() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    return google(modelName);
  }

  // Fallback to OpenAI
  return openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
}

export function isAiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}
