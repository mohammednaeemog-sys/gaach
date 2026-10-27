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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">AI Tree Advisor</p>
          <h1 className="font-display mt-1 text-3xl text-forest-900 sm:text-4xl">Your personal tree expert</h1>
        </div>
        <Link href="/assistant" className="btn-primary">+ New chat</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="card p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500"><Icon.chat className="h-4 w-4" /> Your chats</p>
            {conversations.length === 0 ? (
              <p className="text-sm text-stone-500">No chats yet. Ask your first question.</p>
            ) : (
              <ul className="-mx-1 max-h-[46vh] space-y-0.5 overflow-y-auto">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/assistant?c=${c.id}`} className={`block rounded-xl px-3 py-2 text-sm transition hover:bg-mint-50 ${c.id === convo?.id ? "bg-mint-100 font-medium text-forest-900" : "text-stone-700"}`}>
                      <span className="line-clamp-1">{c.title}</span>
                      <span className="text-xs text-stone-400">{dateText(c.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-3xl bg-forest-900 p-5 text-sm text-white/80">
            <p className="font-display text-lg text-white">What I can do</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2"><Icon.pin className="h-4 w-4 shrink-0 text-lime-300" /> Suggest trees for your saved places</li>
              <li className="flex gap-2"><Icon.water className="h-4 w-4 shrink-0 text-lime-300" /> Explain watering, soil and care</li>
              <li className="flex gap-2"><Icon.warn className="h-4 w-4 shrink-0 text-lime-300" /> Check a photo of a sick plant (📷)</li>
              <li className="flex gap-2"><Icon.scale className="h-4 w-4 shrink-0 text-lime-300" /> Compare trees, prices and stock</li>
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
