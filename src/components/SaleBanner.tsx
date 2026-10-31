"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type BannerSale = { id: string; name: string; badge: string; percentOff: number; message: string; theme: string; endsAt: string | null; allTrees: boolean };

// Colours and floating shapes for each occasion
export const THEMES: Record<string, { label: string; bg: string; accent: string; shape: string }> = {
  general: { label: "General sale", bg: "linear-gradient(110deg,#183d27,#2f6b3f 45%,#183d27)", accent: "#f2994a", shape: "leaf" },
  eid: { label: "Eid", bg: "linear-gradient(110deg,#0f2a1d,#1f5135 45%,#0f2a1d)", accent: "#e9c46a", shape: "star" },
  boishakh: { label: "Pohela Boishakh", bg: "linear-gradient(110deg,#9b1c1c,#d9480f 45%,#9b1c1c)", accent: "#ffe8a3", shape: "flower" },
  monsoon: { label: "Monsoon planting", bg: "linear-gradient(110deg,#0f3b4a,#1f6f78 45%,#0f3b4a)", accent: "#a7f3d0", shape: "drop" },
  winter: { label: "Winter", bg: "linear-gradient(110deg,#1e3a5f,#3f6e8f 45%,#1e3a5f)", accent: "#fde68a", shape: "flake" },
  victory: { label: "Victory / Independence Day", bg: "linear-gradient(110deg,#006a4e,#0a8a63 45%,#006a4e)", accent: "#f42a41", shape: "circle" },
};

function Shape({ kind, color }: { kind: string; color: string }) {
  const p = { viewBox: "0 0 24 24", className: "h-full w-full", fill: color } as const;
  if (kind === "star") return <svg {...p}><path d="M12 2l2.4 6.9H22l-6 4.5 2.3 7.1L12 16l-6.3 4.5L8 13.4 2 8.9h7.6z" /></svg>;
  if (kind === "flower") return <svg {...p}>{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="12" cy="6.5" rx="3" ry="5" transform={`rotate(${a} 12 12)`} />)}<circle cx="12" cy="12" r="2.6" fill="#fff" /></svg>;
  if (kind === "drop") return <svg {...p}><path d="M12 2C9 7 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3-7-6-12z" /></svg>;
  if (kind === "flake") return <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" /></svg>;
  if (kind === "circle") return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  return <svg {...p}><path d="M5 19C5 10 11 5 20 5c0 8-6 14-15 14z" /></svg>;
}

function left(endsAt: string | null, now: number) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

// Animated strip under the header that tells shoppers which occasion sale is on and why
export function SaleBanner({ sales }: { sales: BannerSale[] }) {
  const path = usePathname();
  const [i, setI] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (sales.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % sales.length), 6000);
    return () => clearInterval(t);
  }, [sales.length]);
  if (!sales.length || hidden || path?.startsWith("/admin")) return null;
  const s = sales[i % sales.length];
  const th = THEMES[s.theme] ?? THEMES.general;
  const countdown = now ? left(s.endsAt, now) : null;

  return (
    <div className="sale-banner relative overflow-hidden text-white" style={{ background: th.bg, backgroundSize: "200% 100%" }} role="region" aria-label="Current sale">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 9 }).map((_, k) => (
          <span key={k} className="sale-float absolute" style={{ left: `${(k * 11.3 + 4) % 100}%`, width: `${0.6 + (k % 3) * 0.3}rem`, height: `${0.6 + (k % 3) * 0.3}rem`, animationDelay: `${-k * 1.3}s`, animationDuration: `${7 + (k % 4) * 2}s`, opacity: 0.22 }}>
            <Shape kind={th.shape} color={th.accent} />
          </span>
        ))}
        <span className="sale-shine absolute inset-y-0 w-1/3" />
      </div>
      <div key={s.id} className="sale-in relative mx-auto flex max-w-[87.5rem] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-10 py-2 text-center text-[0.8125rem] sm:justify-between sm:py-2.5 sm:text-sm sm:text-left lg:px-10">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="sale-pulse rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#1c1d1a]" style={{ background: th.accent }}>
            {s.badge} · {s.percentOff}% off
          </span>
          <b className="font-semibold">{s.name}</b>
          {s.message && <span className="text-xs text-white/85 sm:text-sm">{s.message}</span>}
          {!s.allTrees && <span className="text-xs text-white/70">(selected trees)</span>}
        </div>
        <div className="flex items-center gap-3">
          {countdown && <span className="font-mono text-xs tabular-nums text-white/90">Ends in {countdown}</span>}
          <Link href="/trees?sale=1" className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-[#183d27] transition hover:scale-105">Shop the sale</Link>
        </div>
      </div>
      <button type="button" onClick={() => setHidden(true)} aria-label="Hide sale banner" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/80 hover:bg-white/15 hover:text-white">✕</button>
    </div>
  );
}
