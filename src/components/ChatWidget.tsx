"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chat } from "./Chat";

// The floating Tree Advisor: a round button in the corner of every page that
// opens a chat panel. It says hello once per visit with a small speech bubble.
const HIDDEN_ON = ["/assistant", "/admin", "/login", "/register", "/forgot-password", "/reset-password", "/checkout", "/pay"];
const GREETED = "gaach-advisor-greeted";

function Avatar({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <span className={`advisor-avatar relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#fbf3df] via-white to-mint-100 ring-2 ring-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/gaach-mark.svg" alt="" className="h-[82%] w-[82%]" />
    </span>
  );
}

export function ChatWidget({ loggedIn, firstName, offline }: { loggedIn: boolean; firstName: string | null; offline: boolean }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [greet, setGreet] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const treeSlug = pathname.match(/^\/trees\/([^/]+)$/)?.[1] ?? null;
  const treeName = treeSlug ? treeSlug.replace(/-/g, " ") : null;

  // Say hello once per visit, a few seconds after the first page loads
  useEffect(() => {
    if (hidden) return;
    let seen = false;
    try { seen = sessionStorage.getItem(GREETED) === "1"; } catch { /* storage blocked */ }
    if (seen) return;
    const t = setTimeout(() => {
      setGreet(true);
      try { sessionStorage.setItem(GREETED, "1"); } catch { /* storage blocked */ }
    }, 2800);
    const hide = setTimeout(() => setGreet(false), 14000);
    return () => { clearTimeout(t); clearTimeout(hide); };
  }, [hidden]);

  useEffect(() => {
    if (!open) return;
    setGreet(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 250);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  const suggestions = treeSlug
    ? ["How do I plant this tree?", "How often should I water it?", "Will it suit my rooftop?", "Is it in stock and how much is it?"]
    : ["Which fruit tree suits my rooftop?", "My lemon tree's leaves are turning yellow", "Guava or lemon: which needs less space?", "What should I do next for my tree?"];

  return (
    <div className="advisor-root">
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Gaach Tree Advisor"
        aria-hidden={!open}
        className={`advisor-panel fixed inset-x-2 bottom-2 top-16 z-50 flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1.875rem_5rem_-1.25rem_rgb(8_32_26/0.55)] ring-1 ring-black/5 sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[37.5rem] sm:max-h-[calc(100vh-8rem)] sm:w-[24.375rem] ${open ? "is-open" : ""}`}
      >
        <div className="flex items-center gap-3 bg-forest-900 px-4 py-3 text-white">
          <span className="relative">
            <Avatar className="h-10 w-10" />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-lime-400 ring-2 ring-forest-900" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Gaach Tree Advisor</span>
            <span className="block truncate text-[0.6875rem] text-mint-200/75">{treeSlug ? `Ask me about the ${treeName}` : offline ? "Answers from Gaach's tree and care data" : "Online · answers in a few seconds"}</span>
          </span>
          {loggedIn && (
            <button type="button" onClick={() => { setConversationId(null); setChatKey((k) => k + 1); }} className="rounded-full px-2 py-1 text-[0.6875rem] text-mint-100 hover:bg-white/10" title="Start a new chat">+ New chat</button>
          )}
          <Link href={conversationId ? `/assistant?c=${conversationId}` : "/assistant"} onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" title="Open the full chat page" aria-label="Open the full chat page">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-lg leading-none hover:bg-white/10" aria-label="Close the Tree Advisor">×</button>
        </div>

        {loggedIn ? (
          open || conversationId ? (
            <div className="min-h-0 flex-1">
              <Chat
                key={chatKey}
                variant="widget"
                initialMessages={[]}
                conversationId={conversationId}
                treeSlug={treeSlug}
                treeName={null}
                ownedId={null}
                autoAsk={null}
                suggestions={suggestions}
                offline={offline}
                onConversation={setConversationId}
                firstName={firstName}
              />
            </div>
          ) : null
        ) : (
          <div className="flex flex-1 flex-col justify-center gap-4 p-6 text-center">
            <Avatar className="mx-auto h-20 w-20" />
            <div>
              <p className="font-display text-xl font-semibold text-forest-900">Hi, I&apos;m your Tree Advisor</p>
              <p className="mt-2 text-sm text-stone-600">I help you choose the right tree, plan planting and care, and work out problems like yellow leaves. Log in so I can use your saved sites and the trees you bought.</p>
            </div>
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary mx-auto px-6 py-2.5">Log in to chat</Link>
            <Link href="/register" className="text-sm font-medium text-lime-600 hover:underline">Create a free account</Link>
          </div>
        )}
      </div>

      {/* Greeting bubble pointing at the button */}
      {greet && !open && (
        <div className="advisor-greet fixed bottom-24 right-5 z-50 w-64 rounded-2xl rounded-br-md bg-white p-4 pr-8 text-sm text-forest-900 shadow-[0_1.25rem_3.125rem_-0.9375rem_rgb(8_32_26/0.45)] ring-1 ring-black/5">
          <button type="button" onClick={() => setGreet(false)} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-stone-400 hover:bg-stone-100" aria-label="Dismiss">×</button>
          <p className="font-semibold">Hi{firstName ? ` ${firstName}` : ""}! 🌱</p>
          <p className="mt-1 text-stone-600">Not sure which tree fits your space, or why the leaves are yellow? Ask me.</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-lime-600 hover:underline">Start a chat →</button>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close the Tree Advisor" : "Open the Tree Advisor chat"}
        className={`advisor-launcher fixed bottom-4 right-4 z-50 flex items-center sm:bottom-5 sm:right-5 ${open ? "max-sm:hidden" : ""}`}
      >
        <span className="relative">
          {!open && <span className="advisor-ping absolute inset-0 rounded-full" aria-hidden />}
          <Avatar className="h-14 w-14 shadow-[0_0.75rem_1.875rem_-8px_rgb(8_32_26/0.6)] sm:h-16 sm:w-16" />
          <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-lime-400 ring-2 ring-white" />
        </span>
        <span className={`relative z-10 -ml-3 grid h-8 w-8 place-items-center rounded-full bg-forest-950 text-white shadow-md ring-2 ring-white transition-transform duration-300 ${open ? "rotate-90" : ""}`} aria-hidden>
          {open ? "×" : "›"}
        </span>
      </button>
    </div>
  );
}
