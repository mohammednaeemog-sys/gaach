"use client";

import { useEffect, useState } from "react";
import { TreeArt } from "./TreeArt";

type Img = { key: string; src: string | null; label: string };

// Main picture with thumbnails; follows the size picked in the buy box
export function Gallery({ images, shape, color, name }: { images: Img[]; shape: string; color: string; name: string }) {
  const [cur, setCur] = useState(images[0]?.key);
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (images.some((i) => i.key === id)) setCur(id);
    };
    window.addEventListener("gaach:size", on);
    return () => window.removeEventListener("gaach:size", on);
  }, [images]);
  const main = images.find((i) => i.key === cur) ?? images[0];
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {images.map((i) => (
            <button key={i.key} type="button" onClick={() => setCur(i.key)} aria-label={`Show ${i.label}`} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mint-50 transition sm:h-20 sm:w-20 ${i.key === main?.key ? "ring-2 ring-forest-900" : "opacity-75 ring-1 ring-stone-200 hover:opacity-100"}`}>
              <TreeArt shape={shape} color={color} name={i.label} imageUrl={i.src} animate={false} />
            </button>
          ))}
        </div>
      )}
      <div key={main?.key} className="gallery-main relative aspect-[5/4] flex-1 overflow-hidden rounded-3xl bg-gradient-to-b from-[#eef1ec] to-[#dfe7df]">
        <TreeArt shape={shape} color={color} name={main?.label ?? name} imageUrl={main?.src ?? null} />
        {main && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest-900 shadow-sm">{main.label}</span>}
      </div>
    </div>
  );
}
