// The assistant's controller: checks, routing, memory, the AI or offline
// advisor, answer checks and logging, in that order.
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { ASSISTANT_REFUSAL } from "@/lib/constants";
import type { MessagesClient } from "./claude";
import { askAdvisor, aiConfigured, aiProblem } from "./ai";
import { conversationBlock } from "./prompt";
import { offlineAnswer } from "./offline";
import { findTreesInText } from "./lookup";
import { classify, parseState, summarize, updateTrouble, type ConvoState, type Intent, type Slot, type Trouble } from "./router";
import { newToolContext, type Source, type ToolContext } from "./tools";
import { checkAnswer, toPlainText } from "./validate";

export type ChatResult = {
  conversationId: string;
  reply: string;
  mode: "ai" | "offline";
  refused: boolean;
  notice?: string;
  sources: Source[];
  intent: Intent;
  tools: string[]; // tools used for this answer
  grounded: boolean; // prices and stock in the answer came from this turn's tools
  ms: number;
};

export class RateLimitError extends Error {}

const HISTORY_LIMIT = 12; // earlier messages sent to the AI (conversation memory)
const MAX_MESSAGE = 1500;

// At most 10 questions a minute per user, so one person cannot run up AI costs
const recent = new Map<string, number[]>();
function rateLimit(userId: string) {
  if (process.env.ASSISTANT_EVAL === "1") return; // the evaluation script sends many questions in a row
  const now = Date.now();
  const list = (recent.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= 10) throw new RateLimitError("You are sending questions very quickly. Please wait a minute and try again.");
  list.push(now);
  recent.set(userId, list);
}

export async function chat(opts: {
  userId: string;
  message: string;
  conversationId?: string | null;
  treeSlug?: string | null;
  ownedId?: string | null;
  page?: string | null;
  forceOffline?: boolean; // used by the evaluation script
  client?: MessagesClient; // used by tests
}): Promise<ChatResult> {
  const started = Date.now();
  const message = opts.message.trim().slice(0, MAX_MESSAGE);
  rateLimit(opts.userId);

  const user = await db.user.findUniqueOrThrow({ where: { id: opts.userId } });
  // Users can only reach their own chats and trees (NFR-3.2)
  let convo = opts.conversationId ? await db.conversation.findFirst({ where: { id: opts.conversationId, userId: opts.userId } }) : null;
  if (!convo) {
    const tree = opts.treeSlug ? await db.tree.findFirst({ where: { slug: opts.treeSlug, published: true } }) : null;
    const owned = opts.ownedId ? await db.ownedTree.findFirst({ where: { id: opts.ownedId, userId: opts.userId } }) : null;
    convo = await db.conversation.create({ data: { userId: opts.userId, title: message.slice(0, 60), treeId: tree?.id ?? owned?.treeId ?? null } });
  }

  const state: ConvoState = parseState(convo.state);
  const trees = await db.tree.findMany({ where: { published: true }, select: { id: true, slug: true, name: true, banglaName: true, scientificName: true } });
  const named = findTreesInText(message, trees);
  if (!state.treeSlug && convo.treeId) state.treeSlug = trees.find((t) => t.id === convo!.treeId)?.slug;
  if (named.length) state.treeSlug = named[0].slug;
  const focus = trees.find((t) => t.slug === state.treeSlug) ?? null;

  const sites = await db.site.findMany({ where: { userId: opts.userId }, select: { name: true } });
  const siteHit = sites.find((s) => message.toLowerCase().includes(s.name.toLowerCase()));
  if (siteHit) state.siteName = siteHit.name;

  if (named.length >= 2) state.compareSlugs = named.slice(0, 3).map((t) => t.slug);
  const routed = classify(message, state, named.length, !!siteHit);
  let intent = routed.intent;
  let trouble: Trouble | null = null;
  let nextSlot: Slot | null = null;
  if (intent === "care_troubleshooting") {
    ({ trouble, nextSlot } = updateTrouble(state, message, focus?.slug ?? null));
    state.trouble = trouble;
  }

  const ctx: ToolContext = newToolContext(opts.userId);
  let reply = "";
  let refused = false;
  let refuseReason = routed.reason ?? "";
  let mode: ChatResult["mode"] = (aiConfigured() || opts.client) && !opts.forceOffline ? "ai" : "offline";
  let notice: string | undefined;

  const offline = async () => {
    if (intent === "out_of_scope") {
      refused = true;
      return ASSISTANT_REFUSAL;
    }
    const districts = (await db.district.findMany({ select: { name: true } })).map((d) => d.name);
    return offlineAnswer({ message, intent, state, treeNames: named.map((t) => t.name), compareNames: (state.compareSlugs ?? []).map((sl) => trees.find((t) => t.slug === sl)?.name).filter((n): n is string => !!n), focusTree: focus?.name ?? null, nextSlot, trouble, districts, ctx });
  };

  // Clear manipulation, privacy and off-topic cases are refused before any AI call.
  // Messages that are only unclear ("no tree topic found") are left to the AI.
  const hardRefusal = intent === "out_of_scope" && routed.reason !== "no tree topic found";
  if (hardRefusal || (intent === "out_of_scope" && mode === "offline")) {
    refused = true;
    reply = ASSISTANT_REFUSAL;
  } else if (mode === "offline") {
    notice = "The AI service is not set up, so answers come straight from Gaach's tree and care data.";
    reply = await offline();
  } else {
    const previous = await db.chatMessage.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "desc" }, take: HISTORY_LIMIT });
    previous.reverse();
    const history: Anthropic.MessageParam[] = previous.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    // The history must start with the user and alternate; drop a leading assistant turn
    while (history.length && history[0].role !== "user") history.shift();
    history.push({ role: "user", content: message });
    const conversation = conversationBlock({
      userName: user.name.split(" ")[0],
      today: new Date().toISOString().slice(0, 10),
      intent,
      summary: summarize(state, focus?.name ?? null),
      page: opts.page ?? (focus && convo.treeId ? `the ${focus.name} page` : null),
    });
    try {
      let out = await askAdvisor({ history, conversation, ctx, client: opts.client });
      if (out.kind === "answer") {
        // Answer check: prices and stock must come from this turn's tool results
        const check = checkAnswer(out.text, ctx);
        if (!check.ok) {
          out = await askAdvisor({
            history: [...history, { role: "assistant", content: out.text }, { role: "user", content: `[Gaach answer check, not written by the user] Your answer ${check.problems.join(" and ")}. Look the facts up with your tools and reply with the corrected answer only.` }],
            conversation,
            ctx,
            client: opts.client,
          });
          if (out.kind === "answer" && !checkAnswer(out.text, ctx).ok) {
            out = { kind: "answer", text: `${out.text}\n\nPlease check the current price and stock on the tree page before ordering.` };
          }
        }
      }
      if (out.kind === "out_of_scope") {
        refused = true;
        refuseReason ||= "off-topic (decided by the AI)";
        intent = "out_of_scope";
        reply = ASSISTANT_REFUSAL;
      } else reply = out.text;
    } catch (e) {
      // If the AI service fails, the rest of the platform keeps working (NFR-4.3)
      console.error("assistant: AI call failed", e);
      mode = "offline";
      notice = `This answer comes straight from Gaach's data because ${aiProblem(e)}. An admin can see the details under Admin > AI status.`;
      ctx.sources.length = 0;
      ctx.toolsUsed.length = 0;
      reply = await offline();
    }
  }

  reply = refused ? ASSISTANT_REFUSAL : toPlainText(reply);
  if (!refused && !reply) reply = "Sorry, I could not put an answer together. Please ask again in other words.";
  state.lastIntent = intent;
  const sources = refused ? [] : ctx.sources.slice(0, 6);

  await db.chatMessage.create({ data: { conversationId: convo.id, role: "user", content: message, intent } });
  await db.chatMessage.create({ data: { conversationId: convo.id, role: "assistant", content: reply, tools: [...new Set(ctx.toolsUsed)].join(","), sources: JSON.stringify(sources) } });
  await db.conversation.update({ where: { id: convo.id }, data: { state: JSON.stringify(state), summary: summarize(state, focus?.name ?? null) } });
  // Refused questions are kept for admin review to find content gaps (FR-8.6)
  if (refused) await db.refusedQuestion.create({ data: { userId: opts.userId, question: message, reason: refuseReason || "off-topic" } });

  const grounded = refused || checkAnswer(reply, ctx).ok;
  return { conversationId: convo.id, reply, mode, refused, notice, sources, intent, tools: [...new Set(ctx.toolsUsed)], grounded, ms: Date.now() - started };
}
