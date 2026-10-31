"use client";

import Link from "next/link";
import { useState } from "react";
import { TreeArt } from "./TreeArt";

// Photo area of a product card: swipe through the tree's photos with the arrows
export function CardPhotos({ photos, href, name, shape, color, className = "" }: { photos: string[]; href: string; name: string; shape: string; color: string; className?: string }) {
  const [i, setI] = useState(0);
  const n = photos.length;
  const go = (d: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setI((x) => (x + d + n) % n);
  };
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-mint-50 to-mint-100 ${className}`}>
      <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden>
        {n ? (
          <div className="flex h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
            {photos.map((src, k) => (
              <div key={src} className="h-full w-full shrink-0">
                <TreeArt shape={shape} color={color} name={k ? `${name} ${k + 1}` : name} imageUrl={src} className="transition duration-500 group-hover:scale-105" />
              </div>
            ))}
          </div>
        ) : (
          <TreeArt shape={shape} color={color} name={name} className="transition duration-500 group-hover:scale-105" />
        )}
      </Link>
      {n > 1 && (
        <>
          <button type="button" onClick={go(-1)} aria-label={`Previous photo of ${name}`} className="card-arrow left-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={go(1)} aria-label={`Next photo of ${name}`} className="card-arrow right-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
            {photos.map((src, k) => <span key={src} className={`h-1.5 rounded-full bg-white shadow transition-all ${k === i ? "w-4" : "w-1.5 opacity-60"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
