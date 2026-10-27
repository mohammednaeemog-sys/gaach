"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/modules/site/actions";
import type { FormState } from "@/lib/forms";

const TOPICS = ["General", "An order", "Plant care", "Wholesale or bulk", "Something else"];

export function ContactForm({ name = "", email = "" }: { name?: string; email?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, {});
  const v = state.values ?? { name, email };
  const e = state.errors ?? {};
  if (state.ok)
    return (
      <div className="foot-done flex flex-col items-center rounded-2xl bg-mint-50 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-lime-500 text-xl text-white">✓</span>
        <p className="font-display mt-3 text-xl text-forest-900">Message sent</p>
        <p className="mt-1 text-sm text-stone-600">{state.message}</p>
      </div>
    );
  return (
    <form action={action} className="space-y-4" noValidate>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">Your name</label>
          <input id="c-name" name="name" className="input" autoComplete="name" defaultValue={v.name} aria-invalid={!!e.name} />
          {e.name && <p className="field-error">{e.name}</p>}
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">Email</label>
          <input id="c-email" name="email" type="email" className="input" autoComplete="email" defaultValue={v.email} aria-invalid={!!e.email} />
          {e.email && <p className="field-error">{e.email}</p>}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">Mobile number <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="c-phone" name="phone" type="tel" className="input" autoComplete="tel" defaultValue={v.phone} aria-invalid={!!e.phone} />
          {e.phone && <p className="field-error">{e.phone}</p>}
        </div>
        <div>
          <label htmlFor="c-topic" className="field-label">About</label>
          <select id="c-topic" name="topic" className="input" defaultValue={v.topic || "General"}>
            {TOPICS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="c-message" className="field-label">Message</label>
        <textarea id="c-message" name="message" rows={5} className="input" placeholder="For an order, add your order number." defaultValue={v.message} aria-invalid={!!e.message} />
        {e.message && <p className="field-error">{e.message}</p>}
      </div>
      {state.message && <p className="field-error">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
