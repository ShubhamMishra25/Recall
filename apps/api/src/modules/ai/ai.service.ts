import { openai } from "../../lib/ai";

export interface AIAtomResult {
  front: string;
  back: string;
  tags: string[];
}

// The embedding models accept up to 8,191 tokens of input. We truncate long
// content to a conservative budget so the request never exceeds that cap.
// ~4 chars per token is the standard rough estimate for English prose, which
// is the primary content this app ingests.
const EMBEDDING_MAX_TOKENS = 8000;
const CHARS_PER_TOKEN = 4;

function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;

  let slice = text.slice(0, maxChars);
  // Cut at the last whitespace so we don't split mid-word.
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.6) {
    slice = slice.slice(0, lastSpace);
  }
  return slice.trimEnd() + "…";
}

export class AIService {
  /**
   * Generates a 1536-dimensional vector for pgvector
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const input = truncateToTokenBudget(text, EMBEDDING_MAX_TOKENS);
    const response = await openai.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
      input,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  }

  /**
   * Extracts flashcards and tags from raw text
   */
  static async processAtomContent(
    content: string,
  ): Promise<AIAtomResult | null> {
    const response = await openai.chat.completions.parse({
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at extracting core knowledge into spaced repetition flashcards. Extract the single most important concept from the provided text. Create a concise front (question/prompt) and back (answer/explanation). Also generate 1 to 3 relevant lowercase tags.",
        },
        {
          role: "user",
          content,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "atom_metadata",
          schema: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
            required: ["front", "back", "tags"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    return response.choices[0].message.parsed;
  }
}
