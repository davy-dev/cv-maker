import { vi } from "vitest";
import { anthropic } from "@/lib/ai/client";

/**
 * Requires the test file to declare:
 *   vi.mock("@/lib/ai/client", () => ({ anthropic: { messages: { parse: vi.fn() } } }));
 */
export const parseMessage = vi.mocked(
  anthropic.messages.parse as unknown as (...args: unknown[]) => Promise<unknown>
);

interface ParseParams {
  output_config: { format: { parse: (content: string) => unknown } };
}

/**
 * Mimics a Sonnet 5 reply to messages.parse(): an (omitted) adaptive thinking block,
 * then the text, validated by the real Zod output format like the SDK does
 * (invalid JSON or schema mismatch throws).
 */
export function mockClaudeReply(
  payload: unknown,
  stopReason: "end_turn" | "max_tokens" | "refusal" = "end_turn"
) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  parseMessage.mockImplementation(async (params) => ({
    stop_reason: stopReason,
    content: [
      { type: "thinking", thinking: "", signature: "sig" },
      { type: "text", text },
    ],
    parsed_output: (params as ParseParams).output_config.format.parse(text),
  }));
}

/** The prompt sent in the first Claude call. */
export function sentPrompt(): string {
  const params = parseMessage.mock.calls[0][0] as { messages: { content: string }[] };
  return params.messages[0].content;
}

type Reply = unknown | ((prompt: string) => unknown);

/**
 * One reply per Claude call, in order (e.g. CV draft, then verification).
 * A reply can be computed from the prompt, to reuse the fact ids it contains.
 */
export function mockClaudeReplies(...replies: Reply[]) {
  for (const reply of replies) {
    parseMessage.mockImplementationOnce(async (params) => {
      const prompt = (params as { messages: { content: string }[] }).messages[0].content;
      const payload = typeof reply === "function" ? reply(prompt) : reply;
      const text = typeof payload === "string" ? payload : JSON.stringify(payload);
      return {
        stop_reason: "end_turn",
        content: [{ type: "text", text }],
        parsed_output: (params as ParseParams).output_config.format.parse(text),
      };
    });
  }
}

/** Id of the fact whose text contains `fragment`, read from a prompt: "[F3] …". */
export function factId(prompt: string, fragment: string): string {
  const line = prompt.split("\n").find((l) => /^\[F\d+\]/.test(l) && l.includes(fragment));
  if (!line) throw new Error(`No fact containing "${fragment}" in the prompt`);
  return line.match(/^\[(F\d+)\]/)![1];
}

/** Claim ids listed in a verification prompt: "[C2] « … »". */
export function claimIds(prompt: string): { id: string; text: string }[] {
  return [...prompt.matchAll(/^\[(C\d+)\] « (.*) » —/gm)].map((m) => ({ id: m[1], text: m[2] }));
}
