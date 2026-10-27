// Google Gemini, the free option: the same tools, rules and loop as claude.ts,
// through Gemini's OpenAI-compatible API. A free key comes from
// https://aistudio.google.com/apikey (no card needed).
import { OUT_OF_SCOPE_TOKEN, SYSTEM_RULES } from "./prompt";
import { TOOLS, runTool, type ToolContext } from "./tools";

const URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"]; // the next is tried if one is busy, slow, missing or over its free limit
const RETRY_STATUS = new Set([404, 408, 429, 500, 502, 503, 504]);
const REST_MS = 3 * 60_000; // how long a busy model is skipped
const resting = new Map<string, number>();
export function resetGeminiModels() { resting.clear(); working = null; }
const MAX_ROUNDS = 5;

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }>;

export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY?.trim();
}

function models(): string[] {
  const chosen = process.env.GEMINI_MODEL?.trim();
  return [...new Set([chosen, ...DEFAULT_MODELS].filter((m): m is string => !!m))];
}
let working: string | null = null; // the model that last answered
export function geminiModel() {
  return working ?? models()[0];
}

export class GeminiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

type Msg = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: any[]; tool_call_id?: string };

const TOOL_PARAMS = TOOLS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.jsonSchema } }));

export async function geminiCall(body: Record<string, unknown>, fetchImpl: FetchLike = fetch as unknown as FetchLike, deadline = Date.now() + 60_000): Promise<any> {
  const all = working ? [working, ...models().filter((m) => m !== working)] : models();
  // Skip models that were busy or hung in the last few minutes (unless every model was)
  const now = Date.now();
  const fresh = all.filter((m) => (resting.get(m) ?? 0) < now);
  const list = fresh.length ? fresh : all;
  let last: GeminiError | null = null;
  for (const model of list) {
    const left = deadline - Date.now();
    if (left < 3000) break; // out of time: the caller falls back to Gaach's own data
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await fetchImpl(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GEMINI_API_KEY?.trim()}` },
        body: JSON.stringify({ ...body, model }),
        signal: AbortSignal.timeout(Math.min(25_000, left)),
      });
    } catch (e) {
      // A busy model can hang; move on to the next one
      last = new GeminiError(504, e instanceof Error ? e.message : "The request timed out.");
      if (working === model) working = null;
      resting.set(model, Date.now() + REST_MS);
      continue;
    }
    if (res.ok) {
      working = model;
      return res.json();
    }
    let message = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(await res.text());
      message = (Array.isArray(j) ? j[0] : j)?.error?.message ?? message;
    } catch { /* keep the status */ }
    last = new GeminiError(res.status, message);
    if (working === model) working = null;
    if (RETRY_STATUS.has(res.status)) resting.set(model, Date.now() + REST_MS);
    // Try the next model only when this one is missing, busy or over its free limit
    if (!RETRY_STATUS.has(res.status)) break;
  }
  throw last ?? new GeminiError(504, "Gemini took too long to answer.");
}

export async function askGemini(opts: {
  history: { role: "user" | "assistant"; content: string }[];
  conversation: string;
  ctx: ToolContext;
  fetchImpl?: FetchLike;
}): Promise<{ kind: "answer"; text: string } | { kind: "out_of_scope" }> {
  const fetchImpl = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const deadline = Date.now() + 50_000; // after this the user gets an answer from Gaach's own data instead
  const messages: Msg[] = [{ role: "system", content: `${SYSTEM_RULES}\n\n${opts.conversation}` }, ...opts.history.map((m) => ({ role: m.role, content: m.content }))];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const last = round === MAX_ROUNDS - 1;
    const data = await geminiCall({ messages, tools: TOOL_PARAMS, tool_choice: last ? "none" : "auto", max_tokens: 3000, reasoning_effort: process.env.GEMINI_REASONING?.trim() || "low" }, fetchImpl, deadline);
    const choice = data?.choices?.[0];
    const msg = choice?.message ?? {};
    const text = typeof msg.content === "string" ? msg.content.trim() : "";
    if (text.includes(OUT_OF_SCOPE_TOKEN)) return { kind: "out_of_scope" };
    const calls: any[] = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    if (!calls.length) {
      if (!text) throw new GeminiError(0, `Gemini returned no answer (finish reason: ${choice?.finish_reason ?? "unknown"}).`);
      return { kind: "answer", text };
    }
    // Send the model's turn back unchanged (it can carry Gemini's thought signatures)
    const withIds = calls.map((c, i) => ({ ...c, id: c.id || `call_${round}_${i}` }));
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: withIds });
    for (const c of withIds) {
      let input: unknown = {};
      try {
        input = c.function?.arguments ? JSON.parse(c.function.arguments) : {};
      } catch {
        input = null;
      }
      const out = input === null ? { ok: false, error: "The tool input was not valid JSON." } : await runTool(c.function?.name ?? "", input, opts.ctx);
      messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(out) });
    }
  }
  throw new GeminiError(0, "The AI did not finish within the allowed number of steps.");
}

export function geminiProblem(status: number, message: string): string {
  const m = message.toLowerCase();
  if (status === 400 && /api key|api_key/.test(m)) return "The Gemini API key was rejected. Check that GEMINI_API_KEY is copied correctly from Google AI Studio.";
  if (status === 401 || status === 403) return "The Gemini API key is not allowed to do this (wrong key, or the Gemini API is not enabled for its project).";
  if (status === 404) return "The Gemini model was not found. Remove GEMINI_MODEL from .env to use the default models.";
  if (status === 429) return "The free Gemini limit was reached for now. It resets after a minute, or daily at midnight Pacific time.";
  if (status >= 500) return `Gemini had an error (${status}). Try again later.`;
  if (status === 400) return `Gemini rejected the request (400): ${message}`;
  return "Could not reach Gemini. Check the internet connection or firewall.";
}

export async function checkGemini(fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  try {
    await geminiCall({ messages: [{ role: "user", content: "Reply with the word ok." }], max_tokens: 200 }, fetchImpl);
    return { ok: true as const };
  } catch (e) {
    const err = e as GeminiError;
    return { ok: false as const, problem: geminiProblem(err.status ?? 0, err.message ?? String(e)), detail: `${err.name ?? "Error"}: ${err.message ?? String(e)}`.slice(0, 600) };
  }
}
