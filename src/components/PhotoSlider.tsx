"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TreeArt } from "./TreeArt";

// Photo strip with round arrows on both sides; swipe works on phones too.
// A null photo shows the potted-sapling drawing ("how it arrives").
// Each slide gets a short tag in the bottom-left corner; the dots sit bottom-right so they never overlap.
export function PhotoSlider({ photos, name, shape, color, href, className = "", big = false, tag }: { photos: (string | null)[]; name: string; shape: string; color: string; href?: string; className?: string; big?: boolean; tag?: string }) {
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
        <div key={(src ?? "art") + k} className="relative h-full w-full shrink-0 overflow-hidden" aria-hidden={k !== i}>
          <TreeArt shape={shape} color={color} name={k ? `${name} ${k + 1}` : name} imageUrl={src === "grown" ? null : src} grown={src === "grown"} animate={false} className={big ? "" : "transition duration-500 group-hover:scale-105"} />
          {(src === "grown" ? "Fully grown" : !src ? (n > 1 ? "Sapling" : null) : tag) && (
            <span className={`slide-tag ${big ? "slide-tag-big" : ""}`}>{src === "grown" ? "Fully grown" : !src ? "Sapling" : tag}</span>
          )}
        </div>
      ))}
    </div>
  );
  return (
    <div
      className={`slider relative overflow-hidden bg-gradient-to-b from-mint-50 to-mint-100 ${className}`}
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
          <button type="button" onClick={go(-1)} aria-label={`Previous photo of ${name}`} className={`slide-arrow left-2 ${big ? "slide-arrow-big" : ""}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={go(1)} aria-label={`Next photo of ${name}`} className={`slide-arrow right-2 ${big ? "slide-arrow-big" : ""}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className={`pointer-events-none absolute flex gap-1 ${big ? "bottom-5 right-5" : "bottom-[1.1rem] right-3"}`} aria-hidden>
            {photos.map((src, k) => <span key={k} className={`h-1.5 rounded-full bg-white shadow transition-all ${k === i ? "w-4" : "w-1.5 opacity-60"}`} />)}
          </div>
          <span className="sr-only" aria-live="polite">Photo {i + 1} of {n}</span>
        </>
      )}
    </div>
  );
}
