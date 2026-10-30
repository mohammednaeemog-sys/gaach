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
// Numbered step heading used for the two parts of the form
function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <legend className="mb-3 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1d5b33] text-sm font-semibold text-white">{n}</span>
      <span>
        <span className="block font-semibold text-forest-900">{title}</span>
        <span className="block text-xs text-stone-500">{text}</span>
      </span>
    </legend>
  );
}

const SunIcon = ({ kind }: { kind: string }) => (
  <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-forest-900" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {kind === "FULL" ? (
      <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" /></>
    ) : kind === "PARTIAL" ? (
      <><path d="M8 4v1.5M3.5 8.5H5M4.8 5.2l1 1M11.2 5.2l-1 1" /><path d="M5.6 11.3A3 3 0 1 1 10.9 8" /><path d="M8 19h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.5A2.8 2.8 0 0 0 8 19z" /></>
    ) : (
      <path d="M6.5 19h11a4 4 0 0 0 .4-8 6 6 0 0 0-11.5 1.6A3.2 3.2 0 0 0 6.5 19z" />
    )}
  </svg>
);

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
        <Step n={1} title="Where will you plant?" text="Choose your division and district to get trees that suit your local climate." />
        <div>
          <label htmlFor="divisionId" className="field-label">Division</label>
          <select id="divisionId" name="divisionId" className="input" value={v.divisionId ?? ""} onChange={set("divisionId")} aria-invalid={!!errors.districtId}>
            <option value="">Select division</option>
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="districtId" className="field-label">District</label>
          <select id="districtId" name="districtId" className="input" value={v.districtId ?? ""} onChange={set("districtId")} disabled={!division} aria-invalid={!!errors.districtId}>
            <option value="">{division ? "Select district" : "Select a division first"}</option>
            {division?.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {err("districtId")}
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-stone-100 pt-5">
        <Step n={2} title="What is the spot like?" text="Tell us about the available space and environment." />
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
              <label key={s} title={SUNLIGHT_HINTS[s]} className={`sun-card cursor-pointer rounded-xl border p-3 text-center text-sm transition ${v.sunlight === s ? "border-lime-500 bg-mint-50 shadow-[0_8px_1.25rem_-0.75rem_rgb(53_199_89/0.8)]" : "border-stone-200 bg-white hover:border-lime-400"}`}>
                <input type="radio" name="sunlight" value={s} checked={v.sunlight === s} onChange={set("sunlight")} className="sr-only" />
                <SunIcon kind={s} />
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
      </fieldset>

      <fieldset className="space-y-3 border-t border-stone-100 pt-5">
        <Step n={3} title="What is the tree for?" text="Pick the main reason you are planting." />
        <div>
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

      <button className="btn-primary btn-shine w-full justify-center bg-[#1d4a2f] py-3 hover:bg-[#1d5b33]">Show recommended trees →</button>
    </form>
  );
}
