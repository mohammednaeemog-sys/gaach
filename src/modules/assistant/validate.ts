// Checks an answer before it is shown (response validation step).
// - Prices and stock must come from what the tools returned this turn.
// - Formatting is reduced to plain text; replies are never rendered as HTML.
import type { ToolContext } from "./tools";

export type Check = { ok: true } | { ok: false; problems: string[] };

const PRICE = /(?:৳|tk\.?|taka|bdt)\s?(\d[\d,]*)|(\d[\d,]*)\s?(?:৳|tk\b|taka|bdt)/gi;

export function pricesIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(PRICE)) {
    const n = Number((m[1] ?? m[2]).replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

export function checkAnswer(text: string, ctx: Pick<ToolContext, "prices" | "toolsUsed">): Check {
  const problems: string[] = [];
  const bad = pricesIn(text).filter((p) => !ctx.prices.has(p));
  // Sums of looked-up prices (e.g. "two saplings cost ৳900") are allowed
  const known = [...ctx.prices];
  // e.g. quantity x price, possibly plus the delivery fee
  const isSum = (p: number) => known.some((a) => Array.from({ length: 20 }, (_, i) => a * (i + 1)).some((x) => x === p || known.some((b) => x + b === p)));
  const ungrounded = bad.filter((p) => !isSum(p));
  if (ungrounded.length) problems.push(`mentions ${ungrounded.map((p) => `৳${p}`).join(", ")}, which no tool returned this turn`);
  if (/\b(in stock|out of stock|available now|sold out|\d+ (left|in stock))\b/i.test(text) && !ctx.toolsUsed.includes("get_product_details")) {
    problems.push("talks about stock without checking current stock");
  }
  return problems.length ? { ok: false, problems } : { ok: true };
}

// Plain text for the chat window
export function toPlainText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1")
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
