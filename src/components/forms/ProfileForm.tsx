"use client";

import { useActionState } from "react";
import { updateProfile } from "@/modules/accounts/actions";
import type { FormState } from "@/lib/forms";

export function ProfileForm({ defaults, email }: { defaults: Record<string, string>; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, { values: defaults });
  const v = state.values ?? defaults;
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.ok && <p className="rounded-lg bg-mint-50 p-3 text-sm text-forest-700">{state.message}</p>}
      <div>
        <span className="field-label">Email</span>
        <p className="text-sm text-stone-600">{email}</p>
      </div>
      <div>
        <label htmlFor="name" className="field-label">Name</label>
        <input id="name" name="name" className="input" defaultValue={v.name} />
        {e.name && <p className="field-error">{e.name}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="field-label">Mobile number</label>
        <input id="phone" name="phone" type="tel" placeholder="01712345678" className="input" defaultValue={v.phone} />
        {e.phone && <p className="field-error">{e.phone}</p>}
      </div>
      <div>
        <label htmlFor="address" className="field-label">Delivery address</label>
        <textarea id="address" name="address" rows={3} className="input" defaultValue={v.address} />
        {e.address && <p className="field-error">{e.address}</p>}
      </div>
      <button className="btn-primary" disabled={pending}>Save profile</button>
    </form>
  );
}
