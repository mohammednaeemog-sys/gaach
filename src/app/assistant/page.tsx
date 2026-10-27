import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { aiConfigured } from "@/modules/assistant/ai";
import { Chat } from "@/components/Chat";
import { dateText } from "@/lib/format";
import { Icon } from "@/components/icons";

export const metadata = { title: "Tree Advisor" };

function parseSources(json: string) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

type SP = { tree?: string; owned?: string; q?: string; c?: string };

export default async function AssistantPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  const user = await requireUser(`/assistant${qs ? `?${qs}` : ""}`);

  const conversations = await db.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 20 });
  const convo = sp.c ? await db.conversation.findFirst({ where: { id: sp.c, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" } } } }) : null;
  const owned = sp.owned ? await db.ownedTree.findFirst({ where: { id: sp.owned, userId: user.id }, include: { tree: true } }) : null;
  const treeId = convo?.treeId ?? owned?.treeId;
  const tree = sp.tree
    ? await db.tree.findFirst({ where: { slug: sp.tree, published: true } })
    : treeId ? await db.tree.findUnique({ where: { id: treeId } }) : null;

  const refusal = "Sorry, I can only assist";
  const suggestions = tree
    ? [`How do I plant a ${tree.name.split(" (")[0].toLowerCase()}?`, `How often should I water it?`, `What fertilizer does it need?`, `Is it in stock and how much is it?`]
    : ["Which fruit tree suits my rooftop?", "My lemon tree's leaves are turning yellow", "What should I do next for my tree?", "Guava or lemon: which needs less space?", "Why wasn't mango recommended for my rooftop?", "Is the Amrapali mango in stock?"];

  return (
    <div>
      <h1 className="sr-only">Gaach Tree Advisor</h1>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="card p-3">
            <div className="mb-1 flex items-center justify-between gap-2 px-2 pt-1">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500"><Icon.chat className="h-4 w-4" /> Your chats</p>
              <Link href="/assistant" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-forest-700 hover:bg-mint-50"><Icon.plus className="h-3.5 w-3.5" /> New chat</Link>
            </div>
            {conversations.length === 0 ? (
              <p className="px-2 pb-2 text-sm text-stone-500">No chats yet. Ask your first question.</p>
            ) : (
              <ul className="max-h-[40vh] space-y-1 overflow-y-auto lg:max-h-[calc(100svh-26rem)]">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/assistant?c=${c.id}`} className={`chat-thread ${c.id === convo?.id ? "is-active" : "text-forest-900"}`} aria-current={c.id === convo?.id ? "page" : undefined}>
                      <Icon.chat className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-sm font-medium">{c.title}</span>
                        <span className="chat-thread-date block text-xs text-stone-500">{dateText(c.updatedAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl bg-[#1d4a2f] p-5 text-sm text-white/85">
            <p className="font-display pb-3 text-xl text-white">What I can do</p>
            <ul>
              <li className="can-do-row"><Icon.leaf className="h-6 w-6 shrink-0 text-white" /> Suggest trees for your saved places</li>
              <li className="can-do-row"><Icon.doc className="h-6 w-6 shrink-0 text-white" /> Explain watering, soil and care</li>
              <li className="can-do-row"><Icon.camera className="h-6 w-6 shrink-0 text-white" /> Check a photo of a sick plant</li>
              <li className="can-do-row"><Icon.bars className="h-6 w-6 shrink-0 text-white" /> Compare trees, prices and stock</li>
            </ul>
          </div>
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          <Chat
            key={convo?.id ?? `${sp.tree ?? ""}-${sp.owned ?? ""}-${sp.q ?? ""}`}
            initialMessages={(convo?.messages ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content, refused: m.role === "assistant" && m.content.startsWith(refusal), sources: parseSources(m.sources) }))}
            conversationId={convo?.id ?? null}
            treeSlug={tree?.slug ?? null}
            treeName={tree?.name ?? null}
            ownedId={owned?.id ?? null}
            autoAsk={!convo && sp.q ? sp.q.slice(0, 500) : null}
            suggestions={suggestions}
            offline={!aiConfigured()}
            firstName={user.name.split(" ")[0]}
          />
        </div>
      </div>
    </div>
  );
}
