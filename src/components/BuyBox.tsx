"use client";

import { useState } from "react";
import { addToCart, buyNow } from "@/modules/shop/cart";

// priceBdt is what the customer pays now; wasBdt is the normal price when on sale
type Product = { id: string; sizeLabel: string; ageMonths: number; priceBdt: number; stock: number; wasBdt?: number | null; percentOff?: number; occasion?: string | null };

const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`;

// Price, size cards, quantity and the two buy buttons on a tree page and in the quick view
export function BuyBox({ products, back, onSelect }: { products: Product[]; back: string; onSelect?: (id: string) => void }) {
  const first = products.find((p) => p.stock > 0) ?? products[0];
  const [id, setId] = useState(first?.id);
  const [qty, setQty] = useState(1);
  const p = products.find((x) => x.id === id) ?? first;
  if (!p) return null;
  const max = Math.max(1, Math.min(p.stock, 50));
  const out = p.stock === 0;
  const pick = (x: Product) => { setId(x.id); setQty(1); onSelect?.(x.id); window.dispatchEvent(new CustomEvent("gaach:size", { detail: x.id })); };

  return (
    <div className="space-y-5">
      <div>
        {p.wasBdt && (
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#912018]">
            <span className="rounded-full bg-[#b42318] px-2.5 py-0.5 text-white">−{p.percentOff}%</span>
            {p.occasion ?? "On sale"}
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p key={p.id} className={`price-pop text-[2rem] font-bold leading-none ${p.wasBdt ? "text-[#b42318]" : "text-forest-900"}`}>{taka(p.priceBdt)}</p>
          {p.wasBdt && <s className="text-lg text-stone-400">{taka(p.wasBdt)}</s>}
          <p className={`text-sm font-semibold ${out ? "text-red-700" : p.stock <= 5 ? "text-[#a15c07]" : "text-leaf-700"}`}>{out ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}</p>
        </div>
        {products.length === 1 && <p className="mt-1.5 text-sm text-stone-500">{p.sizeLabel} · about {p.ageMonths} months old</p>}
      </div>

      {products.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-forest-900">Choose a size</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {products.map((x) => {
              const on = x.id === p.id;
              return (
                <label key={x.id} className={`flex cursor-pointer gap-3 rounded-xl p-3.5 transition ${on ? "bg-leaf-50 ring-2 ring-leaf-700" : "bg-white ring-1 ring-stone-200 hover:ring-leaf-500"} ${x.stock === 0 ? "opacity-60" : ""}`}>
                  <input type="radio" name="size-pick" checked={on} onChange={() => pick(x)} className="mt-1 accent-[#23632a]" />
                  <span className="min-w-0">
                    <b className="block text-sm text-forest-900">{x.sizeLabel}</b>
                    <span className="block text-[0.8125rem] text-stone-500">About {x.ageMonths} months · {taka(x.priceBdt)}{x.stock === 0 ? " · sold out" : ""}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <form action={addToCart} className="space-y-2.5">
        <input type="hidden" name="productId" value={p.id} />
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="quantity" value={qty} />
        <div className="flex gap-2.5">
          <div className="flex shrink-0 items-center rounded-xl bg-white ring-1 ring-stone-200" aria-label="Quantity">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-11 place-items-center text-lg leading-none hover:text-leaf-700" aria-label="One less">−</button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid h-12 w-11 place-items-center text-lg leading-none hover:text-leaf-700" aria-label="One more">+</button>
          </div>
          <button disabled={out} className="h-12 flex-1 rounded-xl bg-leaf-700 px-6 text-[0.9375rem] font-semibold text-white transition hover:bg-leaf-800 active:scale-[0.98] disabled:opacity-50">Add to cart</button>
        </div>
        <button formAction={buyNow} disabled={out} className="h-12 w-full rounded-xl border border-leaf-700 bg-white px-6 text-[0.9375rem] font-semibold text-leaf-700 transition hover:bg-leaf-50 disabled:opacity-50">Buy now</button>
      </form>
    </div>
  );
}
