"use client";

import { useEffect, useState } from "react";
import { TreeArt } from "./TreeArt";

type Img = { key: string; src: string | null; label: string };

// Big picture with a row of thumbnails under it; follows the size picked in the buy box
export function Gallery({ images, shape, color, name, badge }: { images: Img[]; shape: string; color: string; name: string; badge?: string | null }) {
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
    <div className="space-y-3">
      <div key={main?.key} className="gallery-main relative aspect-square overflow-hidden rounded-[1.25rem] bg-gradient-to-b from-[#eef1ec] to-[#dfe7df] sm:aspect-[5/4.4]">
        <TreeArt shape={shape} color={color} name={main?.label ?? name} imageUrl={main?.src === "grown" ? null : main?.src ?? null} grown={main?.src === "grown"} />
        {badge && <span className="sale-badge absolute left-4 top-4 z-10 !text-[0.8125rem]">{badge}</span>}
        {main && <span className="slide-tag slide-tag-big">{main.label}</span>}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {images.map((i) => (
            <button key={i.key} type="button" onClick={() => setCur(i.key)} aria-label={`Show ${i.label}`} aria-pressed={i.key === main?.key} className={`aspect-square overflow-hidden rounded-xl bg-mint-50 transition ${i.key === main?.key ? "ring-2 ring-leaf-700 ring-offset-2 ring-offset-[#faf7f1]" : "opacity-80 ring-1 ring-stone-200 hover:opacity-100"}`}>
              <TreeArt shape={shape} color={color} name={i.label} imageUrl={i.src === "grown" ? null : i.src} grown={i.src === "grown"} animate={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
