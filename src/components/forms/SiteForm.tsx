"use client";

import { useState } from "react";
import { PURPOSES, SOILS, SOIL_HINTS, SUNLIGHT, SUNLIGHT_HINTS, label } from "@/lib/constants";

export type DivisionOption = { id: number; name: string; districts: { id: number; name: string }[] };
export type SavedSite = { id: string; name: string; districtId: number; divisionId: number; spaceM: number; sunlight: string; soil: string; purpose: string };
export type SiteValues = { divisionId?: string; districtId?: string; spaceM?: string; sunlight?: string; soil?: string; purpose?: string };

type Props = {
  divisions: DivisionOption[];
  savedSites: SavedSite[];
  initial: SiteValues;
  errors: Record<string, string>;
  compact?: boolean;
};

// Location and planting-conditions form (FR-2.1 to FR-2.3). Submits by GET so the
// results URL keeps every input, which makes refining a search quick (FR-3.4).
export function SiteForm({ divisions, savedSites, initial, errors, compact }: Props) {
  const [v, setV] = useState<SiteValues>(initial);
  const division = divisions.find((d) => String(d.id) === v.divisionId);
  const set = (k: keyof SiteValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((old) => ({ ...old, [k]: e.target.value, ...(k === "divisionId" ? { districtId: "" } : {}) }));

  function useSaved(id: string) {
    const s = savedSites.find((x) => x.id === id);
    if (!s) return;
    setV({ divisionId: String(s.divisionId), districtId: String(s.districtId), spaceM: String(s.spaceM), sunlight: s.sunlight, soil: s.soil, purpose: s.purpose });
  }

  const err = (k: string) => (errors[k] ? <p className="field-error" role="alert">{errors[k]}</p> : null);

  return (
    <form method="get" action="/recommend" className="space-y-5" noValidate>
      {savedSites.length > 0 && (
        <div>
          <label htmlFor="saved" className="field-label">Use a saved site</label>
          <select id="saved" className="input" defaultValue="" onChange={(e) => useSaved(e.target.value)}>
            <option value="">Choose a saved site...</option>
            {savedSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <fieldset className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <legend className="mb-2 text-sm font-semibold text-forest-700">1. Where will you plant?</legend>
        <div>
          <label htmlFor="divisionId" className="field-label">Division</label>
          <select id="divisionId" name="divisionId" className="input" value={v.divisionId ?? ""} onChange={set("divisionId")} aria-invalid={!!errors.districtId}>
            <option value="">Choose division</option>
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="districtId" className="field-label">District</label>
          <select id="districtId" name="districtId" className="input" value={v.districtId ?? ""} onChange={set("districtId")} disabled={!division} aria-invalid={!!errors.districtId}>
            <option value="">{division ? "Choose district" : "Choose a division first"}</option>
            {division?.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {err("districtId")}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold text-forest-700">2. What is the spot like?</legend>
        <div>
          <label htmlFor="spaceM" className="field-label">Available space (maximum canopy width, in metres)</label>
          <input id="spaceM" name="spaceM" type="number" inputMode="decimal" min="0.5" max="100" step="0.5" placeholder="e.g. 3" className="input" value={v.spaceM ?? ""} onChange={set("spaceM")} aria-invalid={!!errors.spaceM} />
          <p className="hint">How wide the tree can grow without touching walls or other trees. A rooftop drum is about 2 to 3 m; a village yard is often 8 m or more.</p>
          {err("spaceM")}
        </div>

        <div>
          <span className="field-label">Sunlight</span>
          <div className={`grid gap-2 ${compact ? "grid-cols-3" : "sm:grid-cols-3"}`}>
            {SUNLIGHT.map((s) => (
              <label key={s} title={SUNLIGHT_HINTS[s]} className={`sun-card cursor-pointer rounded-2xl border p-3 text-center text-sm transition ${v.sunlight === s ? "border-lime-500 bg-mint-50 shadow-[0_8px_20px_-12px_rgb(53_199_89/0.8)]" : "border-stone-200 bg-white hover:border-lime-400"}`}>
                <input type="radio" name="sunlight" value={s} checked={v.sunlight === s} onChange={set("sunlight")} className="sr-only" />
                <span className="mx-auto block text-2xl" aria-hidden>{s === "FULL" ? "☀️" : s === "PARTIAL" ? "⛅" : "🌥️"}</span>
                <span className="mt-1 block font-medium text-forest-900">{label(s)}</span>
                {!compact && <span className="mt-1 block text-xs text-stone-500">{SUNLIGHT_HINTS[s]}</span>}
              </label>
            ))}
          </div>
          {v.sunlight && compact && <p className="hint">{SUNLIGHT_HINTS[v.sunlight as keyof typeof SUNLIGHT_HINTS]}</p>}
          {err("sunlight")}
        </div>

        <div>
          <span className="field-label">Soil type</span>
          <div className="flex flex-wrap gap-2">
            {SOILS.map((x) => (
              <label key={x} className={`pill-radio ${v.soil === x ? "is-on" : ""}`}>
                <input type="radio" name="soil" value={x} checked={v.soil === x} onChange={set("soil")} className="sr-only" />
                {label(x)}
              </label>
            ))}
          </div>
          <p className="hint">{v.soil ? SOIL_HINTS[v.soil as keyof typeof SOIL_HINTS] : "Not sure? Choose Loam."}</p>
          {err("soil")}
        </div>
        <div>
          <span className="field-label">What is the tree for?</span>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((x) => (
              <label key={x} className={`pill-radio ${v.purpose === x ? "is-on" : ""}`}>
                <input type="radio" name="purpose" value={x} checked={v.purpose === x} onChange={set("purpose")} className="sr-only" />
                {label(x)}
              </label>
            ))}
          </div>
          {err("purpose")}
        </div>
      </fieldset>

      <button className="btn-primary btn-shine w-full py-3">Show recommended trees →</button>
    </form>
  );
}
