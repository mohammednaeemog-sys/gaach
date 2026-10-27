// Calls Claude with Gaach's read-only tools in a loop until it gives an answer.
import type Anthropic from "@anthropic-ai/sdk";
import { OUT_OF_SCOPE_TOKEN, SYSTEM_RULES } from "./prompt";
import { TOOLS, runTool, type ToolContext } from "./tools";

export function aiConfigured() {
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function modelName() {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-5-5";
}

// Only the one method we use, so tests can pass a fake client
export type MessagesClient = { messages: { create: (p: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message> } };

let client: MessagesClient | null = null;

// The SDK is loaded only when a question is sent to the AI, so a problem
// loading it can never break the assistant page itself (NFR-4.3).
async function getClient(): Promise<MessagesClient> {
  if (!client) {
    const { default: AnthropicSDK } = await import("@anthropic-ai/sdk");
    // The key stays on the server and is never sent to the browser (NFR-3.3)
    client = new AnthropicSDK({ timeout: 25_000, maxRetries: 1 });
  }
  return client;
}

const MAX_ROUNDS = 5; // tool rounds per question; keeps answers near the ~10 s target (NFR-2.2)

export type AdvisorReply = { kind: "answer"; text: string } | { kind: "out_of_scope" };

const TOOL_PARAMS: Anthropic.Tool[] = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.jsonSchema as Anthropic.Tool.InputSchema,
}));

export async function askAdvisor(opts: {
  history: Anthropic.MessageParam[]; // earlier turns plus the new user message
  conversation: string; // CONVERSATION STATE block
  ctx: ToolContext;
  client?: MessagesClient;
}): Promise<AdvisorReply> {
  const api = opts.client ?? (await getClient());
  const messages: Anthropic.MessageParam[] = [...opts.history];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const last = round === MAX_ROUNDS - 1;
    const response = await api.messages.create({
      model: modelName(),
      max_tokens: 3000,
      // Low effort keeps replies quick for chat (NFR-2.2)
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM_RULES, cache_control: { type: "ephemeral" } },
        { type: "text", text: opts.conversation },
      ],
      tools: TOOL_PARAMS,
      // On the last round the model must answer with what it has
      ...(last ? { tool_choice: { type: "none" as const } } : {}),
      messages,
    });

    if (response.stop_reason === "refusal") return { kind: "out_of_scope" };
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text.includes(OUT_OF_SCOPE_TOKEN)) return { kind: "out_of_scope" };

    const calls = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!calls.length || response.stop_reason !== "tool_use") {
      if (!text) throw new Error(`The AI returned no answer (stop reason: ${response.stop_reason}).`);
      return { kind: "answer", text };
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const call of calls) {
      const out = await runTool(call.name, call.input, opts.ctx);
      results.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(out), ...(out.ok === false ? { is_error: true } : {}) });
    }
    messages.push({ role: "user", content: results });
  }
  throw new Error("The AI did not finish within the allowed number of steps.");
}

// A tiny live request used by the admin AI status page to show the exact
// reason the AI is not working (missing key, wrong model name, no credit...)
export async function checkConnection(): Promise<{ ok: true; model: string; ms: number } | { ok: false; model: string; problem: string; detail: string }> {
  const model = modelName();
  if (!aiConfigured()) return { ok: false, model, problem: "No API key", detail: "ANTHROPIC_API_KEY is not set in the .env file, so the assistant runs in offline mode." };
  const started = Date.now();
  try {
    const api = await getClient();
    await api.messages.create({ model, max_tokens: 20, messages: [{ role: "user", content: "Reply with the word ok." }] });
    return { ok: true, model, ms: Date.now() - started };
  } catch (e) {
    const err = e as { status?: number; message?: string; name?: string };
    const problem =
      err.status === 401 ? "The API key was rejected (401). Check that it is copied correctly and still active."
      : err.status === 403 ? "The API key is not allowed to use this model (403)."
      : err.status === 404 ? `The model "${model}" was not found (404). Check ANTHROPIC_MODEL, or remove it to use the default.`
      : err.status === 400 ? "The request was rejected (400). This is often a billing problem, such as no credit on the account."
      : err.status === 429 ? "Rate limit or spending limit reached (429)."
      : err.status && err.status >= 500 ? `The AI service had an error (${err.status}). Try again later.`
      : "Could not reach the AI service. Check the internet connection or firewall.";
    return { ok: false, model, problem, detail: `${err.name ?? "Error"}: ${err.message ?? String(e)}`.slice(0, 600) };
  }
}
