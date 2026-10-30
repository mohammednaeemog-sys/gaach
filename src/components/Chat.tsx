"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

type Source = { kind: string; title: string; href: string; note?: string };
type Msg = { role: "user" | "assistant"; content: string; refused?: boolean; sources?: Source[]; image?: string };

const ICON: Record<string, string> = { tree: "🌳", guide: "📘", site: "📍", purchase: "🪴", recommendation: "✨", product: "🛒" };

// Where the answer's facts came from (shown under each answer)
function Sources({ items }: { items: Source[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-mint-200/70 pt-2">
      <span className="text-[0.6875rem] font-medium text-stone-500">Based on:</span>
      {items.map((s) => (
        <Link key={s.href} href={s.href} className="rounded-full bg-white px-2 py-0.5 text-[0.6875rem] text-forest-700 ring-1 ring-mint-200 hover:bg-mint-100" title={s.note ?? s.title}>
          {ICON[s.kind] ?? "•"} {s.title}{s.note ? " *" : ""}
        </Link>
      ))}
    </div>
  );
}

type Props = {
  initialMessages: Msg[];
  conversationId: string | null;
  treeSlug: string | null;
  treeName: string | null;
  ownedId: string | null;
  autoAsk: string | null;
  suggestions: string[];
  offline: boolean;
  variant?: "page" | "widget"; // the widget is the floating chat panel
  onConversation?: (id: string) => void;
  firstName?: string | null;
};

const QUICK = [
  { icon: Icon.search, title: "Find a tree", text: "for my place", ask: "Which tree suits my place? I have a small rooftop with full sun." },
  { icon: Icon.camera, title: "Check a photo", text: "spot the problem", ask: "" },
  { icon: Icon.doc, title: "Care plan", text: "what to do next", ask: "What should I do next for my tree?" },
  { icon: Icon.cart, title: "Prices and stock", text: "sizes and offers", ask: "Is the Amrapali mango in stock and how much is it?" },
];

// Shown in turn while the advisor works, so the wait never looks frozen
const PHOTO_STATUS = ["Looking closely at your photo…", "Checking the leaves and stems…", "Comparing with common problems…", "Matching Gaach's care guides…", "Writing your answer…"];
const STATUS = ["Reading your question…", "Checking your sites and trees…", "Looking at Gaach's tree data…", "Reading the care guides…", "Writing your answer…"];

function Avatar({ small = false }: { small?: boolean }) {
  return (
    <span className={`chat-avatar ${small ? "h-7 w-7" : "h-9 w-9"}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/gaach-mark.svg" alt="" className="h-full w-full" />
    </span>
  );
}

function Status({ photo = false }: { photo?: boolean }) {
  const steps = photo ? PHOTO_STATUS : STATUS;
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => Math.min(v + 1, steps.length - 1)), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="chat-msg flex items-start gap-2.5" aria-label="The advisor is looking this up">
      <Avatar small />
      <div className="rounded-2xl rounded-tl-md bg-mint-50 px-4 py-3 text-sm text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="typing-dot" /><span className="typing-dot" style={{ animationDelay: "0.15s" }} /><span className="typing-dot" style={{ animationDelay: "0.3s" }} />
          <span key={n} className="chat-status ml-1.5 text-xs font-medium text-forest-700">{steps[n]}</span>
        </span>
      </div>
    </div>
  );
}

// Plain-text rendering: replies are never inserted as HTML (NFR-3.3).
function Body({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n{2,}/).map((para, i) => {
        const lines = para.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return <ul key={i} className="list-disc space-y-1 pl-5">{lines.map((l, j) => <li key={j}>{l.replace(/^\s*[-•*]\s+/, "").replace(/\*\*/g, "")}</li>)}</ul>;
        }
        return <p key={i} className="whitespace-pre-line">{para.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

export function Chat(p: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(p.initialMessages);
  const [conversationId, setConversationId] = useState(p.conversationId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(p.offline ? "The AI service is not set up, so answers come straight from Gaach's tree and care data." : null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const widget = p.variant === "widget";
  const asked = useRef(false);

  // Scroll only the message list, never the page behind it
  useEffect(() => {
    const el = listRef.current;
    if (el && (messages.length || busy)) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Shrinks a photo in the browser (longest side 1024 px, JPEG) so it uploads fast on mobile data
  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Please choose a photo.");
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      let q = 0.85;
      let data = canvas.toDataURL("image/jpeg", q);
      while (data.length > 1_300_000 && q > 0.4) data = canvas.toDataURL("image/jpeg", (q -= 0.15));
      setPhoto(data);
    } catch {
      setError("That photo couldn't be opened. Try another one.");
    }
  }

  async function send(text: string) {
    const message = text.trim();
    const image = photo;
    if ((!message && !image) || busy) return;
    setError(null);
    setBusy(true);
    setPhotoBusy(!!image);
    setInput("");
    setPhoto(null);
    setMessages((m) => [...m, { role: "user", content: message, image: image ?? undefined }]);
    try {
      const res = image
        ? await fetch("/api/photo-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image, note: message, conversationId, treeSlug: p.treeSlug }),
          })
        : await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, conversationId, treeSlug: p.treeSlug, ownedId: p.ownedId }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The assistant could not answer.");
      setConversationId(data.conversationId);
      if (!conversationId && !widget) router.refresh(); // shows the new chat in the sidebar
      p.onConversation?.(data.conversationId);
      setNotice(data.mode === "offline" ? data.notice : null);
      setMessages((m) => [...m, { role: "assistant", content: data.reply, refused: data.refused, sources: data.sources ?? [] }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((m) => m.slice(0, -1));
      setInput(message);
      setPhoto(image);
    } finally {
      setBusy(false);
      setPhotoBusy(false);
    }
  }

  useEffect(() => {
    if (p.autoAsk && !asked.current) {
      asked.current = true;
      send(p.autoAsk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={widget ? "flex h-full min-h-0 flex-col bg-white" : `advisor-chat relative flex flex-col overflow-hidden rounded-[1.25rem] ${messages.length === 0 ? "is-welcome" : ""}`}>
      {!widget && (
        <div className="advisor-art" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/advisor-leaves.jpg" alt="" className="advisor-art-leaves" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/advisor-book.jpg" alt="" className="advisor-art-book" />
        </div>
      )}
      <div className={widget ? "hidden" : "relative z-10 mx-3 mt-3 flex items-center gap-3 rounded-xl bg-white/85 px-4 py-2.5 shadow-sm ring-1 ring-stone-200/60 backdrop-blur sm:mx-6 sm:mt-4"}>
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base text-forest-900">Gaach Tree Advisor <span className="ml-1.5 inline-flex items-center gap-1 align-middle font-sans text-[0.6875rem] font-medium text-forest-700"><span className="h-1.5 w-1.5 rounded-full bg-forest-700" />Online</span></p>
          <p className="truncate text-xs text-stone-500">{p.treeName ? `Talking about ${p.treeName}. ` : ""}Uses Gaach&apos;s catalogue, care guides and your own sites and trees. It cannot place orders.</p>
        </div>
        {messages.length > 0 && <Link href="/assistant" className="hidden rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-forest-700 hover:bg-mint-50 sm:block">+ New chat</Link>}
      </div>
      {notice && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-900">{notice}</p>}
      <div ref={listRef} className={`relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain ${widget ? "p-4" : "p-4 sm:px-6"}`} aria-live="polite">
        {messages.length === 0 && widget && (
          <div className="chat-welcome space-y-4">
            <div className="flex items-start gap-2.5">
              <Avatar small />
              <div>
                <p className="font-display text-lg text-forest-900">Hello{p.firstName ? ` ${p.firstName}` : ""}, I&apos;m here to help you every step of the way.</p>
                <p className="mt-1 text-sm text-stone-500">{p.treeName ? `Ask me anything about ${p.treeName}.` : "How can I help with your trees today?"}</p>
              </div>
            </div>
            {!p.treeName && (
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK.map((q, i) => (
                  <button key={q.title} type="button" onClick={() => (q.ask ? send(q.ask) : fileRef.current?.click())} className="quick-card" style={{ animationDelay: `${i * 80}ms` }}>
                    <q.icon className="quick-icon" />
                    <span className="font-display block text-base font-semibold text-forest-900">{q.title}</span>
                    <span className="block text-xs text-stone-500">{q.text}</span>
                  </button>
                ))}
              </div>
            )}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Popular questions you can try</p>
              <ul className="space-y-1.5">
                {p.suggestions.slice(0, 3).map((s) => (
                  <li key={s}><button type="button" onClick={() => send(s)} className="popular-q"><span>{s}</span><span aria-hidden="true" className="text-lg leading-none text-forest-900">→</span></button></li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {messages.length === 0 && !widget && (
          <div className="chat-welcome advisor-welcome relative mx-auto flex max-w-[68rem] flex-col gap-6 py-2 sm:py-4">
            <div className="advisor-hello max-w-[33rem] md:ml-[22%]">
              <p className="anim-rise flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.3em] text-[#2f6b3f]">Gaach Tree Advisor <span className="h-px w-9 bg-[#2f6b3f]/60" /></p>
              <h2 className="font-display mt-3 text-[2.1rem] font-semibold leading-[1.05] text-forest-900 sm:text-[2.6rem] xl:text-[3rem]">
                <span className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: "60ms" }}>Hello{p.firstName ? ` ${p.firstName}` : ""},</span></span>
                <span className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: "180ms" }}>I&apos;m here to help you</span></span>
                <span className="hh-line block overflow-hidden pb-1"><span className="block text-[#2f6b3f]" style={{ animationDelay: "300ms" }}>{p.treeName ? `with your ${p.treeName.split(" (")[0].toLowerCase()}.` : "with your trees."}</span></span>
              </h2>
              <p className="anim-rise mt-3 text-[0.9375rem] leading-relaxed text-stone-600 sm:text-base" style={{ animationDelay: "420ms" }}>Ask questions, get personalised recommendations, understand care steps, identify problems from photos and compare trees for your space.</p>
            </div>
            {!p.treeName && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {QUICK.map((q, i) => (
                  <button key={q.title} type="button" onClick={() => (q.ask ? send(q.ask) : fileRef.current?.click())} className="quick-card group relative" style={{ animationDelay: `${480 + i * 90}ms` }}>
                    <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#e6ebdf] text-[#1d5b33] transition duration-300 group-hover:scale-110 group-hover:bg-[#1d5b33] group-hover:text-white"><q.icon className="h-5 w-5" /></span>
                    <span className="font-display block text-[1.05rem] font-semibold text-forest-900">{q.title}</span>
                    <span className="block pr-5 text-xs text-stone-500 sm:text-sm">{q.text}</span>
                    <Icon.chev className="absolute bottom-5 right-4 h-4 w-4 text-forest-900 transition group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            )}
            <div className="anim-rise" style={{ animationDelay: "800ms" }}>
              <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-stone-600">Popular questions you can try</p>
              <ul className="space-y-2">
                {p.suggestions.slice(0, 6).map((s, i) => {
                  const Ic = [Icon.sprout, Icon.leaf, Icon.leaf, Icon.leaf, Icon.leaf, Icon.leaf][i] ?? Icon.leaf;
                  return (
                    <li key={s}>
                      <button type="button" onClick={() => send(s)} className="popular-q group">
                        <span className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e6ebdf] text-[#2f6b3f]"><Ic className="h-3.5 w-3.5" /></span>{s}</span>
                        <Icon.arrow className="h-4 w-4 shrink-0 text-forest-900 transition group-hover:translate-x-1" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} className="chat-msg flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-forest-900 px-4 py-2.5 text-sm text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.image && <img src={m.image} alt="Your plant photo" className="mb-2 max-h-48 rounded-xl object-cover" />}
                {m.content && <Body text={m.content.replace(/^📷 \[photo\]\s*/, "📷 ")} />}
              </div>
            </div>
          ) : (
            <div key={i} className="chat-msg flex items-start gap-2.5">
              <Avatar small />
              <div className={`max-w-[85%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm ${m.refused ? "bg-stone-100 italic text-stone-700" : "bg-mint-50 text-stone-800"}`}>
                <Body text={m.content} />
                {m.sources && <Sources items={m.sources} />}
              </div>
            </div>
          )
        ))}
        {busy && <Status photo={photoBusy} />}
      </div>
      {error && <p className="px-4 pb-1 text-xs font-medium text-red-700" role="alert">{error}</p>}
      {photo && (
        <div className="photo-preview flex items-center gap-3 border-t border-stone-200 px-3 pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Photo to check" className="h-14 w-14 rounded-xl object-cover ring-2 ring-lime-400" />
          <p className="min-w-0 flex-1 text-xs text-stone-600">Add a note if you like (e.g. &quot;lemon tree, leaves yellowing&quot;), then press send.</p>
          <button type="button" onClick={() => setPhoto(null)} className="grid h-8 w-8 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="Remove photo">×</button>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className={`chat-input-bar relative z-10 flex items-center gap-2 ${widget ? "border-t border-stone-200 p-3" : "mx-3 mb-3 rounded-full bg-white/90 p-2 shadow-[0_0.6rem_1.6rem_-1rem_rgb(28_29_26/0.4)] ring-1 ring-stone-200/70 backdrop-blur sm:mx-6 sm:mb-5"}`}>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="chat-photo" aria-label="Attach a plant photo" title="Attach a plant photo">
          <Icon.clip className="h-5 w-5" />
        </button>
        <label htmlFor={widget ? "widget-chat-input" : "chat-input"} className="sr-only">Your question</label>
        <input id={widget ? "widget-chat-input" : "chat-input"} value={input} onChange={(e) => setInput(e.target.value)} maxLength={1500} placeholder={photo ? "Add a note (optional)…" : widget ? "Ask about any tree…" : "e.g. Which fruit tree suits my rooftop?"} className="input chat-field flex-1 rounded-full" disabled={busy} />
        <button className="chat-send" disabled={busy || (!input.trim() && !photo)} aria-label="Send">
          <Icon.send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
