"use client";

import { useState } from "react";
import { addToCart, buyNow } from "@/modules/shop/cart";

type Product = { id: string; sizeLabel: string; ageMonths: number; priceBdt: number; stock: number };

const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`;

// Size picker, quantity and the two buy buttons on a tree page
export function BuyBox({ products, back, onSelect }: { products: Product[]; back: string; onSelect?: (id: string) => void }) {
  const first = products.find((p) => p.stock > 0) ?? products[0];
  const [id, setId] = useState(first?.id);
  const [qty, setQty] = useState(1);
  const p = products.find((x) => x.id === id) ?? first;
  if (!p) return null;
  const max = Math.max(1, Math.min(p.stock, 50));
  const out = p.stock === 0;

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p key={p.id} className="price-pop text-3xl font-bold text-lime-700">{taka(p.priceBdt)}</p>
        <p className="text-sm text-stone-500">{p.sizeLabel} · about {p.ageMonths} months old</p>
      </div>
      <p className={`mt-1 text-xs font-medium ${out ? "text-red-700" : p.stock <= 5 ? "text-amber-700" : "text-lime-700"}`}>{out ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}</p>

      {products.length > 1 && (
        <fieldset className="mt-5">
          <legend className="text-xs font-semibold uppercase tracking-wider text-forest-900">Select size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {products.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => { setId(x.id); setQty(1); onSelect?.(x.id); window.dispatchEvent(new CustomEvent("gaach:size", { detail: x.id })); }}
                aria-pressed={x.id === p.id}
                className={`rounded-full px-4 py-1.5 text-sm transition ${x.id === p.id ? "bg-forest-900 text-white shadow" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-lime-500"} ${x.stock === 0 ? "line-through opacity-60" : ""}`}
              >
                {x.sizeLabel}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <form action={addToCart} className="mt-6 space-y-3">
        <input type="hidden" name="productId" value={p.id} />
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="quantity" value={qty} />
        <div className="flex items-center gap-3">
          <button disabled={out} className="flex-1 rounded-full border border-forest-900/80 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-forest-900 transition hover:bg-mint-50 disabled:opacity-50">Add to cart</button>
          <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-stone-200" aria-label="Quantity">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-lg leading-none hover:bg-mint-100" aria-label="One less">−</button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{String(qty).padStart(2, "0")}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-lg leading-none hover:bg-mint-100" aria-label="One more">+</button>
          </div>
        </div>
        <button formAction={buyNow} disabled={out} className="btn-shine w-full rounded-full bg-forest-900 px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-forest-800 disabled:opacity-50">Buy now</button>
      </form>
    </div>
  );
}
