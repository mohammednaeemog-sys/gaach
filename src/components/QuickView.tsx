"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PhotoSlider } from "./PhotoSlider";
import { BuyBox } from "./BuyBox";
import { Stars } from "./Stars";

export type QuickTree = {
  slug: string; name: string; banglaName: string; description: string; shape: string; color: string;
  facts: string[]; rating?: { avg: number; count: number };
};
export type QuickProduct = { id: string; sizeLabel: string; ageMonths: number; priceBdt: number; wasBdt: number | null; percentOff: number; occasion: string | null; stock: number };
type Badge = { badge: string; percentOff: number; occasion: string | null; style?: React.CSSProperties } | null;

// Eye button that opens a side panel with the tree's photos, price, sizes and Add to cart
export function QuickView({ tree, photos, products, badge, back, buttonClass, label, children }: { tree: QuickTree; photos: (string | null)[]; products: QuickProduct[]; badge: Badge; back: string; buttonClass: string; label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label ?? `Quick view of ${tree.name}`} title={label ? undefined : "Quick view"} className={buttonClass}>{children}</button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={`${tree.name} quick view`}>
          <button type="button" aria-label="Close quick view" className="qv-back absolute inset-0 cursor-default bg-[#1c1d1a]/45 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="qv-panel relative mt-auto flex max-h-[92svh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:mt-0 sm:max-h-none sm:w-[34rem] sm:rounded-none lg:w-[38rem]">
            <div className="relative shrink-0">
              <PhotoSlider photos={photos} name={tree.name} shape={tree.shape} color={tree.color} big className="aspect-[5/4] sm:aspect-[4/3.4]" />
              {badge && (
                <span className="sale-badge absolute left-5 top-5 z-10 !text-sm" title={badge.occasion ?? "On sale"}>{badge.badge} −{badge.percentOff}%</span>
              )}
              <button type="button" onClick={() => setOpen(false)} autoFocus className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-medium text-[#1c1d1a] shadow hover:bg-white">
                Close
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="space-y-5 px-5 pb-8 pt-5 sm:px-8">
              <div>
                <h2 className="font-display text-2xl font-semibold leading-tight text-forest-900 sm:text-[1.75rem]">{tree.name}</h2>
                <p className="mt-0.5 text-sm text-stone-500">{tree.banglaName}</p>
                {tree.rating && tree.rating.count > 0 && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500"><Stars value={tree.rating.avg} size="h-3.5 w-3.5" /> <b className="text-forest-900">{tree.rating.avg.toFixed(1)}</b> ({tree.rating.count} review{tree.rating.count > 1 ? "s" : ""})</p>
                )}
              </div>
              {products.length ? (
                <BuyBox products={products} back={back} />
              ) : (
                <p className="rounded-xl bg-mint-50 p-3 text-sm text-stone-600">This tree is not on sale right now.</p>
              )}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-forest-900">Product description</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
                  {tree.facts.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{tree.description}</p>
              </div>
              <Link href={`/trees/${tree.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f6b3f] hover:underline">
                View full details, care guide and reviews <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
