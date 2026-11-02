"use client";

import { useState } from "react";

type Stage = { stage: string; title: string; planting?: string | null; watering?: string | null; fertilizing?: string | null; protection?: string | null };
const PARTS = [["planting", "Planting"], ["watering", "Watering"], ["fertilizing", "Fertilizing"], ["protection", "Protection"]] as const;

// Care plan, one stage at a time, so the text can be big enough to read
export function CarePlanTabs({ stages }: { stages: Stage[] }) {
  const [cur, setCur] = useState(0);
  const s = stages[cur];
  if (!s) return null;
  return (
    <div className="mt-5">
      <div role="tablist" aria-label="Care stages" className="flex gap-2 overflow-x-auto pb-1">
        {stages.map((x, i) => (
          <button
            key={x.stage}
            type="button"
            role="tab"
            id={`care-tab-${i}`}
            aria-selected={i === cur}
            aria-controls="care-panel"
            onClick={() => setCur(i)}
            className={`h-11 shrink-0 rounded-full px-4 text-sm transition ${i === cur ? "bg-forest-900 font-semibold text-[#f6f2ea]" : "bg-white text-forest-900 ring-1 ring-stone-200 hover:ring-leaf-500"}`}
          >
            {i + 1} · {x.title}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="care-panel" aria-labelledby={`care-tab-${cur}`} key={s.stage} className="anim-rise mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PARTS.filter(([k]) => s[k]).map(([k, t]) => (
          <div key={k} className="rounded-2xl bg-white p-5 ring-1 ring-stone-100">
            <p className="text-[0.9375rem] font-semibold text-leaf-700">{t}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-stone-700">{s[k]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
