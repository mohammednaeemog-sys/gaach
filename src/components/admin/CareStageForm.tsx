"use client";

import { useActionState } from "react";
import { saveCareStage } from "@/modules/admin/actions";
import type { FormState } from "@/lib/forms";

type S = { planting: string; watering: string; fertilizing: string; protection: string };

export function CareStageForm({ treeId, stage, stageLabel, s: initial }: { treeId: string; stage: string; stageLabel: string; s?: S }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCareStage, {});
  const s: S | undefined = (state.values as S | undefined) ?? initial;
  const e = state.errors ?? {};
  return (
    <details className="rounded-lg border border-stone-200 p-3" open={!initial || !!state.errors}>
      <summary className="cursor-pointer font-medium text-forest-700">{stageLabel} {!initial && !state.ok && <span className="chip-warn ml-2">Missing</span>}</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="treeId" value={treeId} />
        <input type="hidden" name="stage" value={stage} />
        {(["planting", "watering", "fertilizing", "protection"] as const).map((k) => (
          <div key={k}>
            <label className="field-label capitalize">{k === "planting" ? "Planting method / upkeep" : k}</label>
            <textarea name={k} rows={2} defaultValue={s?.[k]} className="input" />
            {e[k] && <p className="field-error">{e[k]}</p>}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button className="btn-secondary" disabled={pending}>Save {stageLabel.toLowerCase()}</button>
          {state.ok && <span className="text-xs text-lime-600">{state.message}</span>}
        </div>
      </form>
    </details>
  );
}
