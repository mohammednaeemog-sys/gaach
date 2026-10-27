"use client";

import { useActionState } from "react";
import { setDeliveryFee } from "@/modules/admin/actions";
import type { FormState } from "@/lib/forms";

export function DeliveryFeeForm({ fee }: { fee: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setDeliveryFee, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="fee" className="field-label">Flat delivery fee (৳)</label>
        <input id="fee" name="fee" type="number" min="0" max="5000" defaultValue={fee} className="input w-32" />
      </div>
      <button className="btn-primary" disabled={pending}>Save</button>
      {state.ok && <span className="text-sm text-lime-600">{state.message}</span>}
      {state.errors?.fee && <p className="field-error w-full">{state.errors.fee}</p>}
    </form>
  );
}
