"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { festival } from "@/lib/festivals";
import { Fall, MOTIFS } from "./festival/Motifs";

export type BannerSale = { id: string; name: string; badge: string; percentOff: number; message: string; theme: string; endsAt: string | null; allTrees: boolean };

function left(endsAt: string | null, now: number) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

// Festive strip above the header on every page: the occasion, why, a countdown and a link
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
  const f = festival(s.theme);
  const countdown = now ? left(s.endsAt, now) : null;
  const L = MOTIFS[f.left[0]];
  const R = MOTIFS[f.right[0]];

  return (
    <div className="sale-banner relative overflow-hidden" style={{ background: f.bg, color: f.ink }} role="region" aria-label="Current sale">
      {f.fall && <Fall kind={f.fall} count={12} />}
      <L className="pointer-events-none absolute -bottom-1 left-1 hidden h-[2.6rem] w-auto opacity-90 sm:block" />
      <R className="pointer-events-none absolute -bottom-1 right-10 hidden h-[2.6rem] w-auto opacity-90 sm:block" />
      <div key={s.id} className="sale-in relative mx-auto flex max-w-[87.5rem] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-10 py-2 text-center text-[0.8125rem] sm:justify-between sm:px-16 sm:py-2.5 sm:text-left sm:text-sm lg:px-20">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="sale-pulse rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider" style={{ background: f.accent, color: "#1c1d1a" }}>
            {s.badge} · {s.percentOff}% off
          </span>
          <b className="font-semibold">{s.name}</b>
          {s.message && <span className="text-xs sm:text-sm" style={{ color: f.soft }}>{s.message}</span>}
          {!s.allTrees && <span className="text-xs opacity-75">(selected trees)</span>}
        </div>
        <div className="flex items-center gap-3">
          {countdown && <span className="font-mono text-xs tabular-nums opacity-90">Ends in {countdown}</span>}
          <Link href="/trees?sale=1" className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-[#183d27] shadow transition hover:scale-105">Shop the sale</Link>
        </div>
      </div>
      <button type="button" onClick={() => setHidden(true)} aria-label="Hide sale banner" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full opacity-80 hover:bg-white/15 hover:opacity-100">✕</button>
    </div>
  );
}
