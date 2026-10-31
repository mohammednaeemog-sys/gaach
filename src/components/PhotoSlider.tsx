"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TreeArt } from "./TreeArt";

// Photo strip with arrow tabs on both sides; swipe works on phones too.
// A null photo shows the potted-sapling drawing ("how it arrives").
export function PhotoSlider({ photos, name, shape, color, href, className = "", big = false }: { photos: (string | null)[]; name: string; shape: string; color: string; href?: string; className?: string; big?: boolean }) {
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  const n = photos.length;
  const go = (d: number) => (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setI((x) => (x + d + n) % n);
  };
  const strip = (
    <div className="flex h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
      {photos.map((src, k) => (
        <div key={(src ?? "art") + k} className="relative h-full w-full shrink-0" aria-hidden={k !== i}>
          <TreeArt shape={shape} color={color} name={k ? `${name} ${k + 1}` : name} imageUrl={src} animate={false} className={big ? "" : "transition duration-500 group-hover:scale-105"} />
          {!src && n > 1 && <span className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-0.5 text-[0.625rem] font-medium text-forest-900 shadow-sm">How it arrives: potted sapling</span>}
        </div>
      ))}
    </div>
  );
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-mint-50 to-mint-100 ${className}`}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
        touch.current = null;
      }}
    >
      {href ? <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden>{strip}</Link> : strip}
      {n > 1 && (
        <>
          <button type="button" onClick={go(-1)} aria-label={`Previous photo of ${name}`} className={`slide-arrow left-0 ${big ? "slide-arrow-big" : ""}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={go(1)} aria-label={`Next photo of ${name}`} className={`slide-arrow right-0 ${big ? "slide-arrow-big" : ""}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
            {photos.map((src, k) => <span key={k} className={`h-1.5 rounded-full bg-white shadow transition-all ${k === i ? "w-4" : "w-1.5 opacity-60"}`} />)}
          </div>
          <span className="sr-only" aria-live="polite">Photo {i + 1} of {n}</span>
        </>
      )}
    </div>
  );
}
