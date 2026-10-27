// Picks the AI service for the Tree Advisor:
//   ANTHROPIC_API_KEY set -> Claude (paid)
//   GEMINI_API_KEY set    -> Google Gemini (free tier)
//   neither               -> offline answers from Gaach's own data
// AI_PROVIDER=claude or AI_PROVIDER=gemini forces one when both keys are set.
import type Anthropic from "@anthropic-ai/sdk";
import { askAdvisor as askClaude, checkConnection as checkClaude, aiConfigured as claudeConfigured, modelName as claudeModel, type AdvisorReply, type MessagesClient } from "./claude";
import { askGemini, checkGemini, geminiConfigured, geminiModel, geminiProblem, GeminiError } from "./gemini";

export type Provider = "claude" | "gemini";

export function provider(): Provider | null {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "gemini" && geminiConfigured()) return "gemini";
  if (forced === "claude" && claudeConfigured()) return "claude";
  if (claudeConfigured()) return "claude";
  if (geminiConfigured()) return "gemini";
  return null;
}

export function aiConfigured() {
  return provider() !== null;
}

export function providerLabel(p = provider()) {
  return p === "claude" ? "Claude (Anthropic)" : p === "gemini" ? "Google Gemini (free tier)" : "none (offline mode)";
}

export function modelName() {
  return provider() === "gemini" ? geminiModel() : claudeModel();
}

export async function askAdvisor(opts: { history: Anthropic.MessageParam[]; conversation: string; ctx: Parameters<typeof askClaude>[0]["ctx"]; client?: MessagesClient }): Promise<AdvisorReply> {
  if (opts.client || provider() !== "gemini") return askClaude(opts);
  const history = opts.history.map((m) => ({ role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant", content: typeof m.content === "string" ? m.content : "" }));
  return askGemini({ history, conversation: opts.conversation, ctx: opts.ctx });
}

// A short reason for a failed AI call, shown to the user with the offline answer
export function aiProblem(e: unknown): string {
  if (e instanceof GeminiError) {
    if (e.status === 429) return "the free Gemini limit was reached for now";
    if (e.status === 400 || e.status === 401 || e.status === 403) return "the Gemini key was rejected";
    return "the AI service is not responding";
  }
  const status = (e as { status?: number }).status;
  if (status === 401) return "the AI key was rejected";
  if (status === 404) return "the AI model name is not available";
  if (status === 429) return "the AI usage limit was reached";
  if (status === 400) return "the AI service rejected the request (often a billing issue)";
  return "the AI service is not responding";
}

export async function checkConnection(): Promise<{ ok: true; model: string; ms: number } | { ok: false; model: string; problem: string; detail: string }> {
  const p = provider();
  if (p === "gemini") {
    const started = Date.now();
    const r = await checkGemini();
    return r.ok ? { ok: true, model: geminiModel(), ms: Date.now() - started } : { ok: false, model: geminiModel(), problem: r.problem, detail: r.detail };
  }
  if (p === null) return { ok: false, model: "none", problem: "No AI key", detail: "Neither GEMINI_API_KEY (free) nor ANTHROPIC_API_KEY is set in the .env file, so the advisor answers from Gaach's own data." };
  return checkClaude();
}

export { geminiProblem };
