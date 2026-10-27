"use client";

import { useActionState } from "react";
import { saveSiteInfo } from "@/modules/site/actions";
import { SITE_FIELDS, type SiteInfo } from "@/modules/site/fields";
import type { FormState } from "@/lib/forms";

export function SiteInfoForm({ info }: { info: SiteInfo }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSiteInfo, {});
  const v = (state.values ?? info) as Record<string, string>;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {SITE_FIELDS.map((f) => (
        <div key={f.key} className={"multiline" in f ? "sm:col-span-2" : ""}>
          <label htmlFor={`site-${f.key}`} className="field-label">{f.label}</label>
          {"multiline" in f ? (
            <textarea id={`site-${f.key}`} name={f.key} rows={3} className="input" placeholder={f.placeholder} defaultValue={v[f.key]} />
          ) : (
            <input id={`site-${f.key}`} name={f.key} className="input" placeholder={f.placeholder} defaultValue={v[f.key]} aria-invalid={!!state.errors?.[f.key]} />
          )}
          {state.errors?.[f.key] && <p className="field-error">{state.errors[f.key]}</p>}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save details"}</button>
        {state.ok && <span className="text-sm text-lime-700">{state.message}</span>}
      </div>
    </form>
  );
}
