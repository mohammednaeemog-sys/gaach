"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// The hero photo: a slow drift and zoom, a band of sunlight that passes over it,
// a few leaves floating by, and a small tilt that follows the mouse.
export function HeroPhoto({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(-y * 4).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(x * 5).toFixed(2)}deg`);
      });
    };
    const leave = () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div ref={ref} className="hero-photo relative">
      <div className="hero-photo-frame relative aspect-[4/3.3] overflow-hidden rounded-[2rem] sm:aspect-[4/3.1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Young mango and other saplings growing in a sunny nursery" className="hero-kenburns h-full w-full object-cover" fetchPriority="high" />
        <div className="hero-sunband" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/55 via-transparent to-transparent" aria-hidden />
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className="hero-photo-leaf" style={{ left: `${18 + i * 27}%`, animationDelay: `${i * 3.4 + 1}s`, animationDuration: `${11 + i * 2}s` }} aria-hidden>
            <path d="M3 21 C 3 10, 10 3, 21 3 C 21 14, 14 21, 3 21Z" fill={i === 1 ? "#f5c451" : "#7be495"} />
            <path d="M4 20 L 16 8" stroke="#1a4a3b" strokeOpacity=".35" strokeWidth="1" />
          </svg>
        ))}
        <Link href="/recommend" className="hero-photo-card absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-forest-900/55 px-4 py-3 text-white backdrop-blur-md transition hover:bg-forest-900/70 sm:bottom-6 sm:left-6">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-lime-400" aria-hidden><path d="M4 20 C 4 9, 11 4, 21 4 C 21 14, 15 20, 4 20Z" fill="currentColor" /><path d="M5 19 L 15 9" stroke="#0d2b23" strokeWidth="1.4" /></svg>
          <span>
            <span className="block text-sm font-semibold">Grown for your place</span>
            <span className="block text-xs text-mint-100/80">Explore locally suitable trees</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
