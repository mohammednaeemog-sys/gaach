"use client";

import { useActionState } from "react";
import { saveSite } from "@/modules/accounts/actions";
import type { FormState } from "@/lib/forms";

export function SaveSiteForm({ fields }: { fields: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSite, {});
  if (state.ok) return <p className="rounded-lg bg-mint-50 p-3 text-sm text-forest-700">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="flex-1">
        <label htmlFor="siteName" className="sr-only">Site name</label>
        <input id="siteName" name="siteName" placeholder="Name this site, e.g. Rooftop" className="input" defaultValue={state.values?.siteName} />
        {state.errors?.siteName && <p className="field-error">{state.errors.siteName}</p>}
        {state.message && <p className="field-error">{state.message}</p>}
      </div>
      <button className="btn-secondary" disabled={pending}>Save site</button>
    </form>
  );
}
