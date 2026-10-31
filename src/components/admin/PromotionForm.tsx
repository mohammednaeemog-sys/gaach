"use client";

import { useActionState, useState } from "react";
import { savePromotion } from "@/modules/admin/sales-actions";
import { THEMES } from "@/components/SaleBanner";
import type { FormState } from "@/lib/forms";

function badgeSize(badge: string) {
  const n = Math.max(...badge.split(" ").map((w) => w.length));
  return n > 7 ? { fontSize: "0.44rem" } : n > 5 ? { fontSize: "0.52rem" } : undefined;
}

export type PromoInit = {
  id: string; name: string; badge: string; message: string; theme: string; percentOff: number;
  allTrees: boolean; active: boolean; showBanner: boolean; startsAt: string; endsAt: string; treeIds: string[];
};
type TreeOpt = { id: string; name: string };

const PRESETS = [
  { name: "Eid ul-Fitr sale", badge: "EID SALE", theme: "eid", message: "Celebrate Eid by planting a tree for your family.", percentOff: 15 },
  { name: "Pohela Boishakh offer", badge: "BOISHAKH", theme: "boishakh", message: "Start the new Bangla year with a new tree.", percentOff: 14 },
  { name: "Monsoon planting week", badge: "MONSOON", theme: "monsoon", message: "The rains are the best time to plant. Saplings settle in fast.", percentOff: 20 },
  { name: "Victory Day sale", badge: "VICTORY", theme: "victory", message: "Mark 16 December with a tree that grows for decades.", percentOff: 16 },
  { name: "Winter clearance", badge: "WINTER", theme: "winter", message: "Make room for the new season's saplings.", percentOff: 25 },
];

// Create or edit an occasion sale, with a live preview of the banner shoppers will see
export function PromotionForm({ p, trees }: { p?: PromoInit; trees: TreeOpt[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePromotion, {});
  const e = state.errors ?? {};
  const [f, setF] = useState({
    name: p?.name ?? "", badge: p?.badge ?? "SALE", message: p?.message ?? "", theme: p?.theme ?? "general",
    percentOff: p?.percentOff ?? 10, scope: p && !p.allTrees ? "some" : "all",
  });
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: ev.target.value });
  const th = THEMES[f.theme] ?? THEMES.general;

  return (
    <form action={action} className="space-y-4">
      {p && <input type="hidden" name="id" value={p.id} />}
      {!p && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-500">Quick start:</span>
          {PRESETS.map((x) => (
            <button key={x.name} type="button" onClick={() => setF({ ...f, ...x })} className="rounded-full bg-mint-50 px-3 py-1 font-medium text-forest-800 ring-1 ring-mint-100 hover:bg-mint-100">{x.name}</button>
          ))}
        </div>
      )}

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl text-white" style={{ background: th.bg }} aria-label="Banner preview">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
          <span className="sale-pulse rounded-full px-2.5 py-0.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[#1c1d1a]" style={{ background: th.accent }}>{(f.badge || "SALE").toUpperCase()} · {f.percentOff || 0}% off</span>
          <b>{f.name || "Occasion name"}</b>
          <span className="text-white/85">{f.message || "Why the discount, e.g. celebrate Eid with a tree."}</span>
          <span className="sale-badge ml-auto !h-12 !w-12" style={badgeSize(f.badge.toUpperCase())}><span>{(f.badge || "SALE").toUpperCase()}<br />-{f.percentOff || 0}%</span></span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><label className="field-label text-xs">Occasion name</label><input name="name" value={f.name} onChange={set("name")} placeholder="Eid ul-Adha sale" className="input" />{e.name && <p className="field-error">{e.name}</p>}</div>
        <div><label className="field-label text-xs">Badge text</label><input name="badge" value={f.badge} onChange={set("badge")} maxLength={14} className="input uppercase" />{e.badge && <p className="field-error">{e.badge}</p>}</div>
        <div><label className="field-label text-xs">Discount (%)</label><input name="percentOff" type="number" min="1" max="90" value={f.percentOff} onChange={set("percentOff")} className="input" />{e.percentOff && <p className="field-error">{e.percentOff}</p>}</div>
        <div className="sm:col-span-2 lg:col-span-3"><label className="field-label text-xs">Why the discount (shown on the banner)</label><input name="message" value={f.message} onChange={set("message")} maxLength={140} placeholder="Celebrate Eid by planting a tree for your family." className="input" />{e.message && <p className="field-error">{e.message}</p>}</div>
        <div><label className="field-label text-xs">Banner style</label><select name="theme" value={f.theme} onChange={set("theme")} className="input">{Object.entries(THEMES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        <div><label className="field-label text-xs">Starts (optional)</label><input name="startsAt" type="datetime-local" defaultValue={p?.startsAt} className="input" />{e.startsAt && <p className="field-error">{e.startsAt}</p>}</div>
        <div><label className="field-label text-xs">Ends (optional)</label><input name="endsAt" type="datetime-local" defaultValue={p?.endsAt} className="input" />{e.endsAt && <p className="field-error">{e.endsAt}</p>}</div>
        <label className="flex items-center gap-2 pt-5 text-sm"><input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Switched on</label>
        <label className="flex items-center gap-2 pt-5 text-sm"><input type="checkbox" name="showBanner" defaultChecked={p?.showBanner ?? true} /> Show the animated banner</label>
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
  );
}
