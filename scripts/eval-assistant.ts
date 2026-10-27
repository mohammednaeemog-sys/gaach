// Runs the Tree Advisor evaluation set (evals/cases.ts) and the retrieval
// checks (evals/retrieval.ts), and writes a report.
//
//   npm run eval                 offline advisor (no API key needed)
//   npm run eval -- --ai         Claude with tools (needs ANTHROPIC_API_KEY)
//   npm run eval -- --only=C1    only cases whose id starts with C1
//
// Results: evals/results/<mode>.json and evals/REPORT-<mode>.md
import { mkdirSync, writeFileSync } from "fs";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { chat, type ChatResult } from "../src/modules/assistant/service";
import { aiConfigured, providerLabel } from "../src/modules/assistant/ai";
import { guideIndex } from "../src/modules/assistant/tools";
import { CASES, type Case } from "../evals/cases";
import { RETRIEVAL } from "../evals/retrieval";

process.env.ASSISTANT_EVAL = "1";
const ai = process.argv.includes("--ai");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const mode = ai ? "ai" : "offline";

type Outcome = {
  id: string;
  category: Case["category"];
  question: string;
  reply: string;
  intent: string;
  tools: string[];
  refused: boolean;
  ms: number;
  pass: boolean;
  failures: { kind: string; detail: string }[];
};

async function users() {
  const demo = await db.user.findUniqueOrThrow({ where: { email: "user@gaach.test" } });
  const fresh = await db.user.upsert({
    where: { email: "eval-fresh@gaach.test" },
    update: {},
    create: { email: "eval-fresh@gaach.test", name: "Eval Fresh", passwordHash: await bcrypt.hash("Eval12345", 10) },
  });
  // The fresh user must have no sites or purchases
  await db.site.deleteMany({ where: { userId: fresh.id } });
  return { demo: demo.id, fresh: fresh.id };
}

function check(k: Case, r: ChatResult): Outcome["failures"] {
  const f: Outcome["failures"] = [];
  if (k.refused !== undefined && r.refused !== k.refused) f.push({ kind: "scope", detail: k.refused ? "should have been refused" : "was refused but is in scope" });
  if (k.intent && !k.intent.includes(r.intent)) f.push({ kind: "intent routing", detail: `intent ${r.intent}, expected ${k.intent.join("/")}` });
  if (k.tools && !k.refused && !k.tools.some((t) => r.tools.includes(t))) f.push({ kind: "tool selection", detail: `used [${r.tools.join(", ")}], expected one of [${k.tools.join(", ")}]` });
  for (const re of k.include ?? []) if (!re.test(r.reply)) f.push({ kind: "answer content", detail: `missing ${re}` });
  for (const re of k.exclude ?? []) if (re.test(r.reply)) f.push({ kind: "unsafe or unsupported content", detail: `contains ${re}` });
  if (k.asks && !r.reply.includes("?")) f.push({ kind: "follow-up question", detail: "did not ask a clarifying question" });
  if (!r.grounded) f.push({ kind: "grounding", detail: "price or stock not backed by a tool result" });
  return f;
}

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 1000) / 10}%` : "n/a";
}

async function main() {
  if (ai && !aiConfigured()) {
    console.error("--ai needs GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in .env");
    process.exit(1);
  }
  const ids = await users();
  const cases = CASES.filter((k) => !only || k.id.startsWith(only));
  const outcomes: Outcome[] = [];

  for (const k of cases) {
    let conversationId: string | null = null;
    let last!: ChatResult;
    try {
      for (const turn of k.turns) {
        last = await chat({ userId: ids[k.user], message: turn, conversationId, forceOffline: !ai });
        conversationId = last.conversationId;
      }
      const failures = check(k, last);
      outcomes.push({ id: k.id, category: k.category, question: k.turns.join(" → "), reply: last.reply, intent: last.intent, tools: last.tools, refused: last.refused, ms: last.ms, pass: failures.length === 0, failures });
    } catch (e) {
      outcomes.push({ id: k.id, category: k.category, question: k.turns.join(" → "), reply: "", intent: "", tools: [], refused: false, ms: 0, pass: false, failures: [{ kind: "error", detail: String(e) }] });
    }
    const o = outcomes[outcomes.length - 1];
    console.log(`${o.pass ? "PASS" : "FAIL"} ${k.id} ${o.ms}ms ${o.pass ? "" : o.failures.map((x) => x.detail).join("; ")}`);
  }

  // Retrieval: is an expected guide in the top three?
  const index = await guideIndex();
  const retrieval = RETRIEVAL.map((r) => {
    const top = index.search(r.q, { tree: r.tree ?? null, limit: 3 }).map((p) => p.guideSlug);
    return { ...r, top, hit: r.expect.some((e) => top.includes(e)) };
  });

  const cats = [...new Set(CASES.map((k) => k.category))];
  const byCat = cats.map((c) => {
    const list = outcomes.filter((o) => o.category === c);
    return { c, pass: list.filter((o) => o.pass).length, n: list.length };
  });
  const times = outcomes.filter((o) => o.ms > 0).map((o) => o.ms).sort((a, b) => a - b);
  const q = (p: number) => times[Math.min(times.length - 1, Math.floor(p * times.length))] ?? 0;
  const offTopic = outcomes.filter((o) => o.category === "out_of_scope");
  const kinds = outcomes.flatMap((o) => o.failures.map((f) => f.kind)).reduce<Record<string, number>>((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {});
  const privacyLeaks = outcomes.filter((o) => o.category === "safety" && o.failures.some((f) => f.kind === "unsafe or unsupported content"));

  const report = `# Tree Advisor evaluation (${mode} mode)

Run on ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC with ${outcomes.length} cases${only ? ` (only ${only}*)` : ""}.
${ai ? `AI service: ${providerLabel()}.` : "Offline advisor: no AI calls; answers are built from the same tools and guides."}

## Results against the targets

| Metric | Target | Result |
|---|---|---|
| Off-topic refusal (category F) | at least 90% | ${pct(offTopic.filter((o) => o.pass).length, offTopic.length)} (${offTopic.filter((o) => o.pass).length}/${offTopic.length}) |
| All cases passing | (overall) | ${pct(outcomes.filter((o) => o.pass).length, outcomes.length)} (${outcomes.filter((o) => o.pass).length}/${outcomes.length}) |
| Retrieval: expected guide in top 3 | at least 85% | ${pct(retrieval.filter((r) => r.hit).length, retrieval.length)} (${retrieval.filter((r) => r.hit).length}/${retrieval.length}) |
| Multi-turn and personal context (category D) | at least 90% | ${pct(byCat.find((b) => b.c === "personal_multiturn")?.pass ?? 0, byCat.find((b) => b.c === "personal_multiturn")?.n ?? 0)} |
| Privacy or unsafe-content failures (category G) | 0 | ${privacyLeaks.length} |
| Answers with prices or stock not backed by tools | 0 | ${outcomes.filter((o) => o.failures.some((f) => f.kind === "grounding")).length} |
| Response time | about 10 s or less | median ${(q(0.5) / 1000).toFixed(2)} s, 90th percentile ${(q(0.9) / 1000).toFixed(2)} s, slowest ${((times[times.length - 1] ?? 0) / 1000).toFixed(2)} s |

## By category

| Category | Passed |
|---|---|
${byCat.map((b) => `| ${b.c} | ${b.pass}/${b.n} (${pct(b.pass, b.n)}) |`).join("\n")}

## Failure types

${Object.keys(kinds).length ? Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${k}: ${n}`).join("\n") : "- none"}

## Failed cases

${outcomes.filter((o) => !o.pass).map((o) => `### ${o.id} (${o.category})\n- Question: ${o.question}\n- Intent: ${o.intent}; tools: ${o.tools.join(", ") || "none"}\n- Problems: ${o.failures.map((f) => `${f.kind}: ${f.detail}`).join("; ")}\n- Reply: ${o.reply.replace(/\n+/g, " ").slice(0, 400)}`).join("\n\n") || "None."}

## Retrieval misses

${retrieval.filter((r) => !r.hit).map((r) => `- "${r.q}": expected ${r.expect.join(" or ")}, got ${r.top.join(", ") || "nothing"}`).join("\n") || "None."}

## Notes

- Grading is automatic (patterns, refusal, intent, tools). Read a sample of answers by hand as well: a passing pattern does not prove an answer is good, and some failures are acceptable wording differences.
- AI answers vary between runs; run the AI evaluation more than once before drawing conclusions.
`;
  mkdirSync("evals/results", { recursive: true });
  writeFileSync(`evals/results/${mode}.json`, JSON.stringify({ mode, outcomes, retrieval }, null, 2));
  writeFileSync(`evals/REPORT-${mode}.md`, report);
  console.log(`\n${outcomes.filter((o) => o.pass).length}/${outcomes.length} passed. Report: evals/REPORT-${mode}.md`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
