"use client";

import { useActionState } from "react";
import { checkout } from "@/modules/shop/actions";
import type { FormState } from "@/lib/forms";

export function CheckoutForm({ defaults }: { defaults: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, { values: defaults });
  const v = state.values ?? defaults;
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
      <div>
        <label htmlFor="recipientName" className="field-label">Receiver&apos;s name</label>
        <input id="recipientName" name="recipientName" className="input" defaultValue={v.recipientName} />
        {e.recipientName && <p className="field-error">{e.recipientName}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="field-label">Mobile number</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="01712345678" className="input" defaultValue={v.phone} />
        <p className="hint">The delivery person will call this number.</p>
        {e.phone && <p className="field-error">{e.phone}</p>}
      </div>
      <div>
        <label htmlFor="address" className="field-label">Delivery address</label>
        <textarea id="address" name="address" rows={3} className="input" placeholder="House, road, area, upazila, district" defaultValue={v.address} />
        {e.address && <p className="field-error">{e.address}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 accent-lime-600" /> Save this phone and address to my profile
      </label>
      <fieldset>
        <legend className="field-label">Payment method</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="pay-card">
            <input type="radio" name="paymentMethod" value="COD" defaultChecked={(v.paymentMethod || "COD") === "COD"} className="accent-lime-600" />
            <span><span aria-hidden="true" className="mb-1 block text-xl">💵</span><b>Cash on delivery</b><span className="block text-xs text-stone-500">Pay when the plants arrive.</span></span>
          </label>
          <label className="pay-card">
            <input type="radio" name="paymentMethod" value="ONLINE_TEST" defaultChecked={v.paymentMethod === "ONLINE_TEST"} className="accent-lime-600" />
            <span><span aria-hidden="true" className="mb-1 block text-xl">💳</span><b>Online payment</b> <span className="chip-warn">Test mode</span><span className="block text-xs text-stone-500">You go to the payment gateway&apos;s page. No real money moves.</span></span>
          </label>
        </div>
        {e.paymentMethod && <p className="field-error">{e.paymentMethod}</p>}
      </fieldset>
      <button className="btn-primary w-full py-3 text-base" disabled={pending}>{pending ? "Placing order..." : "Place order"}</button>
    </form>
  );
}
