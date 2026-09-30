import "server-only";
import Anthropic, { AnthropicError } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { anthropic } from "./client";

export const CLAUDE_MODEL = "claude-sonnet-5";

// Sonnet 5 runs adaptive thinking by default, and thinking counts toward max_tokens:
// leave room for it on top of the JSON answer (its tokenizer also uses ~30% more tokens).
export const MAX_OUTPUT_TOKENS = 16000;

/**
 * Asks Claude for JSON matching `schema` (structured outputs) and returns it validated.
 * Returns null when no usable answer came back: refusal, output cut off by
 * max_tokens, or a value failing the schema's client-side checks.
 * API errors (network, rate limit…) are rethrown.
 */
export async function generateStructured<Schema extends z.ZodType>(
  prompt: string,
  schema: Schema
): Promise<z.infer<Schema> | null> {
  try {
    const response = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: zodOutputFormat(schema) },
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      console.error(`Claude stopped with ${response.stop_reason}`);
      return null;
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.APIError || !(error instanceof AnthropicError)) {
      throw error;
    }
    // Parsing or validation failure raised by the SDK
    console.error(error.message);
    return null;
  }
}
