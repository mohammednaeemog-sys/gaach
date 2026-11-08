"use client";

import { useActionState } from "react";
import { deleteProduct, saveProduct } from "@/modules/admin/actions";
import type { FormState } from "@/lib/forms";

type P = { id?: string; sizeLabel: string; ageMonths: number; priceBdt: number; salePriceBdt?: number | null; stock: number; active: boolean; imageUrl?: string | null };

export function ProductForm({ treeId, p: initial, treeImage }: { treeId: string; p?: P; treeImage?: string | null }) {
  const [saved, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [deleted, del, deleting] = useActionState<FormState, FormData>(deleteProduct, {});
  const state = deleted.message ? deleted : saved;
  const v = saved.values;
  const p: P | undefined = v
    ? { id: initial?.id, sizeLabel: v.sizeLabel, ageMonths: Number(v.ageMonths), priceBdt: Number(v.priceBdt), salePriceBdt: v.salePriceBdt ? Number(v.salePriceBdt) : null, stock: Number(v.stock), active: v.active === "on", imageUrl: initial?.imageUrl }
    : initial;
  const e = state.errors ?? {};
  const shown = initial?.imageUrl ?? treeImage;
  return (
    <form action={action} className="grid items-end gap-2 rounded-2xl border border-stone-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto_auto_auto]">
      <input type="hidden" name="treeId" value={treeId} />
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div><label className="field-label text-xs">Plant size</label><input name="sizeLabel" defaultValue={p?.sizeLabel} placeholder="2 ft sapling" className="input" />{e.sizeLabel && <p className="field-error">{e.sizeLabel}</p>}</div>
      <div><label className="field-label text-xs">Age (months)</label><input name="ageMonths" type="number" min="0" defaultValue={p?.ageMonths ?? 12} className="input" />{e.ageMonths && <p className="field-error">{e.ageMonths}</p>}</div>
      <div><label className="field-label text-xs">Price (৳)</label><input name="priceBdt" type="number" min="1" defaultValue={p?.priceBdt} className="input" />{e.priceBdt && <p className="field-error">{e.priceBdt}</p>}</div>
      <div><label className="field-label text-xs" title="Leave empty for no sale price">Sale price (৳)</label><input name="salePriceBdt" type="number" min="1" defaultValue={p?.salePriceBdt ?? ""} placeholder="None" className="input" />{e.salePriceBdt && <p className="field-error">{e.salePriceBdt}</p>}</div>
      <div><label className="field-label text-xs">Stock</label><input name="stock" type="number" min="0" defaultValue={p?.stock ?? 0} className="input" />{e.stock && <p className="field-error">{e.stock}</p>}</div>
      <label className="flex items-center gap-1.5 pb-2 text-xs">{initial ? <><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> On sale</> : <input type="hidden" name="active" value="on" />}</label>
      <button className={initial ? "btn-secondary" : "btn-primary"} disabled={pending || deleting}>{pending ? "Saving…" : initial ? "Save" : "Add product"}</button>
      {initial?.id ? (
        <button
          formAction={del}
          disabled={pending || deleting}
          onClick={(ev) => { if (!confirm(`Delete the size "${initial.sizeLabel}"? This cannot be undone.`)) ev.preventDefault(); }}
          className="h-10 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      ) : (
        <button
          type="button"
          title="Empty every box in this form"
          onClick={(ev) => {
            const f = ev.currentTarget.form;
            f?.querySelectorAll<HTMLInputElement>("input:not([type=hidden]):not([type=checkbox])").forEach((i) => { i.value = ""; });
          }}
          className="h-10 rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
        >
          Clear
        </button>
      )}

      {/* Photo of this size, e.g. what a 2 ft sapling looks like on delivery */}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-8">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mint-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xl">🌱</span>}
        </div>
        <div className="min-w-0 flex-1">
          <label className="field-label text-xs" htmlFor={`img-${initial?.id ?? "new"}`}>
            {initial?.imageUrl ? "Replace the photo of this size" : "Photo of this size (optional)"}
          </label>
          <input id={`img-${initial?.id ?? "new"}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-mint-100 file:px-3 file:py-1.5 file:text-forest-800" />
          <p className="mt-0.5 text-[0.6875rem] text-stone-500">{initial?.imageUrl ? "This size has its own photo." : "Without one, the tree's main photo is shown."} JPG, PNG or WebP, under 2 MB.</p>
          {e.image && <p className="field-error">{e.image}</p>}
        </div>
        {initial?.imageUrl && <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="removeImage" /> Remove this photo</label>}
      </div>

      {state.ok && <p className="text-xs text-lime-600 sm:col-span-8">{state.message}</p>}
      {state.message && !state.ok && <p className="field-error sm:col-span-8">{state.message}</p>}
    </form>
  );
}
