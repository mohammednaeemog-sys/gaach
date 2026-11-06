"use client";

import { useActionState, useEffect, useState } from "react";
import { savePromotion } from "@/modules/admin/sales-actions";
import { FESTIVALS, festival, saleTitle } from "@/lib/festivals";
import { MOTIFS } from "@/components/festival/Motifs";
import { FestivalBanner } from "@/components/festival/FestivalBanner";
import type { FormState } from "@/lib/forms";

export type PromoInit = {
  id: string; name: string; badge: string; message: string; theme: string; percentOff: number;
  allTrees: boolean; active: boolean; showBanner: boolean; heroBanner: boolean; imageUrl: string | null; imageOnly: boolean;
  startsAt: string; endsAt: string; treeIds: string[];
};
export type Upcoming = { key: string; name: string; start: string; end: string; approx: boolean; live: boolean; label: string };
type TreeOpt = { id: string; name: string };

const GROUPS = ["Religious", "National", "Cultural", "Season", "Global", "Other"] as const;

// Create or edit an occasion sale, with festival styles, a festival calendar and a live preview
export function PromotionForm({ p, trees, upcoming = [] }: { p?: PromoInit; trees: TreeOpt[]; upcoming?: Upcoming[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePromotion, {});
  const e = state.errors ?? {};
  const [f, setF] = useState({
    name: p?.name ?? "", badge: p?.badge ?? "SALE", message: p?.message ?? "", theme: p?.theme ?? "general",
    percentOff: p?.percentOff ?? 10, scope: p && !p.allTrees ? "some" : "all", startsAt: p?.startsAt ?? "", endsAt: p?.endsAt ?? "",
    imageOnly: p?.imageOnly ?? false,
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked); }, [picked]);
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });

  // Picking a style also fills the wording, unless the admin has already written their own
  function pickStyle(key: string) {
    const old = festival(f.theme);
    const nu = festival(key);
    setF({
      ...f,
      theme: key,
      badge: !f.badge || f.badge === old.badge || f.badge === "SALE" ? nu.badge : f.badge,
      message: !f.message || f.message === old.message ? nu.message : f.message,
      name: !f.name || f.name === saleTitle(old.key) ? saleTitle(nu.key) : f.name,
      percentOff: Number(f.percentOff) === old.percent || Number(f.percentOff) === 10 ? nu.percent : f.percentOff,
    });
  }
  function fromCalendar(u: Upcoming) {
    const nu = festival(u.key);
    setF({ ...f, theme: u.key, name: u.name, badge: nu.badge, message: nu.message, percentOff: nu.percent, startsAt: u.start, endsAt: u.end });
    document.getElementById(`sale-form-${p?.id ?? "new"}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const image = removeImage ? null : picked ?? p?.imageUrl ?? null;
  return (
    <div className="space-y-5">
      {!p && upcoming.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-forest-900">Festival calendar</p>
          <p className="text-xs text-stone-500">Coming up in Bangladesh. Tap one to fill in the form with its style, wording and dates.</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {upcoming.map((u) => {
              const fe = festival(u.key);
              const Icon = MOTIFS[fe.left[0]];
              return (
                <button key={u.key + u.start} type="button" onClick={() => fromCalendar(u)} className="group relative flex w-44 shrink-0 flex-col overflow-hidden rounded-xl text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="relative flex h-16 items-center justify-between px-3" style={{ background: fe.bg }}>
                    <Icon className="h-12 w-auto" />
                    {u.live && <span className="rounded-full bg-white px-2 py-0.5 text-[0.625rem] font-bold text-red-600">ON NOW</span>}
                  </span>
                  <span className="bg-white px-3 py-2">
                    <b className="block truncate text-xs text-forest-900">{u.name}</b>
                    <span className="block text-[0.6875rem] text-stone-500">{u.label}{u.approx ? " (moon dependent)" : ""}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form id={`sale-form-${p?.id ?? "new"}`} action={action} className="scroll-mt-24 space-y-4">
        {p && <input type="hidden" name="id" value={p.id} />}
        <input type="hidden" name="theme" value={f.theme} />

        <div>
          <p className="field-label text-xs">Festival style</p>
          <div className="space-y-2">
            {GROUPS.map((g) => (
              <div key={g} className="flex flex-wrap items-center gap-1.5">
                <span className="w-16 text-[0.6875rem] font-medium uppercase tracking-wide text-stone-400">{g}</span>
                {FESTIVALS.filter((x) => x.group === g).map((x) => {
                  const Icon = MOTIFS[x.left[0]];
                  const on = x.key === f.theme;
                  return (
                    <button key={x.key} type="button" onClick={() => pickStyle(x.key)} aria-pressed={on} className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition ${on ? "ring-2 ring-forest-900 ring-offset-1" : "ring-1 ring-stone-200 hover:ring-stone-400"}`}>
                      <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full" style={{ background: x.bg }}><Icon className="h-5 w-auto" /></span>
                      {x.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Live preview of the big banner */}
        <div>
          <p className="field-label text-xs">Preview</p>
          <FestivalBanner preview sale={{ name: f.name || "Occasion name", badge: (f.badge || "SALE").toUpperCase(), percentOff: Number(f.percentOff) || 0, message: f.message, theme: f.theme, startsAt: f.startsAt ? `${f.startsAt}:00+06:00` : null, endsAt: f.endsAt ? `${f.endsAt}:00+06:00` : null, imageUrl: image, imageOnly: !!image && f.imageOnly, allTrees: f.scope !== "some" }} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2"><label className="field-label text-xs">Sale name (the big headline)</label><input name="name" value={f.name} onChange={set("name")} placeholder="Eid ul-Adha sale" className="input" />{e.name && <p className="field-error">{e.name}</p>}</div>
          <div><label className="field-label text-xs">Badge text (on product cards)</label><input name="badge" value={f.badge} onChange={set("badge")} maxLength={14} className="input uppercase" />{e.badge && <p className="field-error">{e.badge}</p>}</div>
          <div><label className="field-label text-xs">Discount (%)</label><input name="percentOff" type="number" min="1" max="90" value={f.percentOff} onChange={set("percentOff")} className="input" />{e.percentOff && <p className="field-error">{e.percentOff}</p>}</div>
          <div className="sm:col-span-2 lg:col-span-4"><label className="field-label text-xs">Why the discount (shown on the banners)</label><input name="message" value={f.message} onChange={set("message")} maxLength={140} placeholder="Celebrate Eid by planting a tree for your family." className="input" />{e.message && <p className="field-error">{e.message}</p>}</div>
          <div><label className="field-label text-xs">Starts (optional)</label><input name="startsAt" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} className="input" /><p className="mt-0.5 text-[0.6875rem] text-stone-500">Leave empty to start right away. Prices only change while the sale is live.</p>{e.startsAt && <p className="field-error">{e.startsAt}</p>}</div>
          <div><label className="field-label text-xs">Ends (optional)</label><input name="endsAt" type="datetime-local" value={f.endsAt} onChange={set("endsAt")} className="input" />{e.endsAt && <p className="field-error">{e.endsAt}</p>}</div>
          <div className="sm:col-span-2">
            <label className="field-label text-xs">Your own banner picture (optional)</label>
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(ev) => { const file = ev.target.files?.[0]; setRemoveImage(false); setPicked(file ? URL.createObjectURL(file) : null); }} className="block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-mint-100 file:px-3 file:py-1.5 file:text-forest-800" />
            <p className="mt-0.5 text-[0.6875rem] text-stone-500">Wide picture, about 1600 × 500, under 2 MB. Without one, the festival drawing is used.</p>
            {e.image && <p className="field-error">{e.image}</p>}
            {image && (
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <label className="flex items-center gap-1.5"><input type="checkbox" name="imageOnly" checked={f.imageOnly} onChange={(ev) => setF({ ...f, imageOnly: ev.target.checked })} /> My picture already has the text, show it alone</label>
                {p?.imageUrl && !picked && <label className="flex items-center gap-1.5"><input type="checkbox" name="removeImage" checked={removeImage} onChange={(ev) => setRemoveImage(ev.target.checked)} /> Remove my picture</label>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Switched on</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="heroBanner" defaultChecked={p?.heroBanner ?? true} /> Big banner on the home and shop pages</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="showBanner" defaultChecked={p?.showBanner ?? true} /> Strip at the top of every page</label>
        </div>

        <fieldset>
          <legend className="field-label text-xs">Which trees</legend>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5"><input type="radio" name="scope" value="all" checked={f.scope === "all"} onChange={set("scope")} /> All trees</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="scope" value="some" checked={f.scope === "some"} onChange={set("scope")} /> Only these trees</label>
          </div>
          {f.scope === "some" && (
            <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-stone-200 p-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {trees.map((t) => <label key={t.id} className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-mint-50"><input type="checkbox" name="trees" value={t.id} defaultChecked={p?.treeIds.includes(t.id)} /> {t.name}</label>)}
            </div>
          )}
          {e.trees && <p className="field-error">{e.trees}</p>}
        </fieldset>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : p ? "Save sale" : "Create sale"}</button>
          {state.ok && <p className="text-xs text-lime-700">{state.message}</p>}
          {state.message && !state.ok && <p className="field-error">{state.message}</p>}
        </div>
      </form>
    </div>
  );
}
