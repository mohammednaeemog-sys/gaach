"use client";

import { useActionState } from "react";
import { saveTree } from "@/modules/admin/actions";
import type { FormState } from "@/lib/forms";
import { MONTHS, plantMonths } from "@/lib/planting";
import { GROWTH, LEVELS, PURPOSES, SHAPES, SOILS, SUNLIGHT, label, splitList } from "@/lib/constants";

export type TreeDefaults = {
  id?: string; name: string; slug: string; banglaName: string; scientificName: string; description: string;
  shape: string; color: string; matureHeightM: number; canopySpreadM: number; growthRate: string;
  sunlight: string; soils: string; purposes: string; waterNeed: string; rainfall: string;
  floodTolerance: string; droughtTolerance: string; salinityTolerance: string; fruitingSeason: string; plantMonths?: string;
  cautions: string; published: boolean; imageUrl: string | null; imageCredit: string; imageSourceUrl: string;
};

export function TreeForm({ t: initial }: { t: TreeDefaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTree, {});
  const v = state.values;
  // React resets the form after each submit, so defaults follow the last submitted values
  const t: TreeDefaults = v
    ? { ...initial, ...v, matureHeightM: Number(v.matureHeightM), canopySpreadM: Number(v.canopySpreadM), published: v.published === "1" }
    : initial;
  const e = state.errors ?? {};
  const err = (k: string) => (e[k] ? <p className="field-error">{e[k]}</p> : null);
  const text = (name: keyof TreeDefaults, lbl: string, hint?: string) => (
    <div>
      <label htmlFor={name} className="field-label">{lbl}</label>
      <input id={name} name={name} defaultValue={String(t[name] ?? "")} className="input" />
      {hint && <p className="hint">{hint}</p>}
      {err(name)}
    </div>
  );
  const checks = (name: "sunlight" | "soils" | "purposes" | "rainfall", lbl: string, values: readonly string[]) => (
    <fieldset>
      <legend className="field-label">{lbl}</legend>
      <div className="flex flex-wrap gap-3">
        {values.map((v) => (
          <label key={v} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name={name} value={v} defaultChecked={splitList(t[name]).includes(v)} className="accent-lime-600" /> {label(v)}
          </label>
        ))}
      </div>
      {err(name)}
    </fieldset>
  );
  const select = (name: keyof TreeDefaults, lbl: string, values: readonly string[]) => (
    <div>
      <label htmlFor={name} className="field-label">{lbl}</label>
      <select id={name} name={name} defaultValue={String(t[name] ?? "")} className="input">
        <option value="">Not set</option>
        {values.map((v) => <option key={v} value={v}>{label(v)}</option>)}
      </select>
      {err(name)}
    </div>
  );

  return (
    <form action={action} className="space-y-5">
      {t.id && <input type="hidden" name="id" value={t.id} />}
      {state.message && <p role="alert" className={`rounded-lg p-3 text-sm ${state.ok ? "bg-mint-50 text-forest-700" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("name", "Name (English)")}
        {text("slug", "Web address", "Lowercase with dashes, e.g. mango-himsagar")}
        {text("banglaName", "Bangla name")}
        {text("scientificName", "Scientific name")}
      </div>
      <div>
        <label htmlFor="description" className="field-label">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={t.description} className="input" />
        {err("description")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {text("matureHeightM", "Mature height (m)")}
        {text("canopySpreadM", "Canopy spread (m)")}
        {select("growthRate", "Growth rate", GROWTH)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {checks("sunlight", "Sunlight it tolerates", SUNLIGHT)}
        {checks("soils", "Suitable soils", SOILS)}
        {checks("purposes", "Purposes", PURPOSES)}
        {checks("rainfall", "Rainfall levels it survives", LEVELS)}
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {select("waterNeed", "Water need", LEVELS)}
        {select("floodTolerance", "Flood tolerance", LEVELS)}
        {select("droughtTolerance", "Drought tolerance", LEVELS)}
        {select("salinityTolerance", "Salt tolerance", LEVELS)}
      </div>
      <fieldset>
        <legend className="field-label">Best planting months</legend>
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {MONTHS.map((m, i) => (
            <label key={m} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="plantMonths" value={i + 1} defaultChecked={plantMonths({ slug: t.slug, plantMonths: t.plantMonths }).includes(i + 1)} className="accent-lime-600" /> {m}
            </label>
          ))}
        </div>
        <p className="hint">Shoppers see &ldquo;Plant now&rdquo; in these months, and the tree finder and Tree Advisor use them. Untick all to use Gaach&apos;s default for this tree.</p>
        {err("plantMonths")}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("fruitingSeason", "Fruiting or flowering season")}
        {text("cautions", "Cautions", "Invasive roots, toxicity, thorns. Write \"None significant.\" if none.")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="image" className="field-label">Photo</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
          <p className="hint">JPG, PNG or WebP under 2 MB. Without a photo, an illustration is shown.</p>
          {t.imageUrl && <label className="mt-1 flex items-center gap-1.5 text-xs"><input type="checkbox" name="removeImage" /> Remove current photo</label>}
          {err("image")}
        </div>
        <div className="space-y-3">
          {text("imageCredit", "Photo credit", "Who took it and the license, e.g. Photo: Rahim, CC BY 4.0. Use your own photos or openly licensed ones.")}
          {text("imageSourceUrl", "Photo source link (optional)")}
        </div>
        {select("shape", "Illustration shape", SHAPES)}
        <div>
          <label htmlFor="color" className="field-label">Illustration colour</label>
          <input id="color" name="color" type="color" defaultValue={t.color} className="h-10 w-20 rounded border border-stone-300" />
        </div>
      </div>
      <label className="flex items-center gap-2 rounded-lg bg-mint-50 p-3 text-sm">
        <input type="checkbox" name="publish" defaultChecked={t.published} className="accent-lime-600" />
        <span><b>Published</b>: visible to users. Every attribute must be filled in first.</span>
      </label>
      <button className="btn-primary" disabled={pending}>{pending ? "Saving..." : "Save tree"}</button>
    </form>
  );
}
