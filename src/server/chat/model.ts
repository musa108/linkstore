import { createOpenAI, openai } from "@ai-sdk/openai";

/**
 * Returns the configured LanguageModel.
 * Prefers Google Gemini (Free tier) if GEMINI_API_KEY is provided.
 * Falls back to OpenAI if OPENAI_API_KEY is configured.
 */
export function getChatModel() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (geminiKey) {
    // Google Gemini OpenAI-compatible API endpoint
    const google = createOpenAI({
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
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
