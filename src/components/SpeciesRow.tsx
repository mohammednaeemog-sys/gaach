"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TreeArt } from "./TreeArt";

type Item = { slug: string; name: string; banglaName: string; shape: string; color: string; imageUrl: string | null; thumb?: string | null };

// "Popular species": a row of round tree pictures that moves along by itself
// (pauses on hover or touch) and can be moved with the arrows.
export function SpeciesRow({ items }: { items: Item[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const nudge = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.6), behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => nudge(1), 3800);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div className="flex items-center gap-3 sm:gap-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)}>
      <p className="species-label hidden shrink-0 items-center gap-2.5 text-[15px] font-semibold text-white md:flex">
        <LeafIcon className="species-label-leaf h-5 w-5 text-lime-400" /> Popular species <span className="species-label-line ml-1 h-px w-10 bg-mint-200/40" />
      </p>
      <div ref={track} className="species-track flex flex-1 snap-x overflow-x-auto scroll-smooth py-1">
        {items.map((t, i) => {
          const src = t.thumb ?? t.imageUrl;
          return (
            <Link key={t.slug} href={`/trees/${t.slug}`} className="species-item group flex shrink-0 snap-start items-center gap-3 border-l border-white/10 px-4 first:border-l-0 first:pl-0 sm:px-5" style={{ animationDelay: `${0.9 + i * 0.08}s` }}>
              <span className="species-thumb relative h-14 w-14 shrink-0 rounded-full p-[2px]" style={{ animationDelay: `${i * 0.45}s` }}>
                <span className="block h-full w-full overflow-hidden rounded-full bg-forest-800 ring-1 ring-white/60 transition duration-300 group-hover:ring-2 group-hover:ring-lime-400">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-115" />
                  ) : (
                    <span className="block h-full w-full bg-mint-50"><TreeArt shape={t.shape} color={t.color} name={t.name} animate={false} /></span>
                  )}
                </span>
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-white transition group-hover:text-lime-400">{t.name.split(" (")[0]}</span>
                <span className="mt-0.5 block text-[13px] text-mint-100/80">{t.banglaName.split(" (")[0]}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="hidden shrink-0 gap-2 sm:flex">
        <button type="button" onClick={() => nudge(-1)} aria-label="Previous species" className="species-arrow grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:-translate-x-0.5 hover:border-lime-400 hover:bg-white/10">←</button>
        <button type="button" onClick={() => nudge(1)} aria-label="Next species" className="species-arrow grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:translate-x-0.5 hover:border-lime-400 hover:bg-white/10">→</button>
      </div>
    </div>
  );
}

export function LeafIcon({ className = "h-4 w-4 text-lime-400" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 20 C 4 9, 11 4, 21 4 C 21 14, 15 20, 4 20Z" fill="currentColor" />
      <path d="M5 19 L 15 9" stroke="#0d2b23" strokeWidth="1.4" />
    </svg>
  );
}
