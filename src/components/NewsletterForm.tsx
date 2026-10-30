"use client";

import { useActionState } from "react";
import { subscribe } from "@/modules/site/actions";
import type { FormState } from "@/lib/forms";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  if (state.ok) return <p className="foot-done rounded-2xl bg-white/10 px-4 py-3 text-sm text-lime-300">✓ {state.message}</p>;
  return (
    <form action={action} className="flex flex-wrap gap-2" noValidate>
      <label htmlFor="news-email" className="sr-only">Your email address</label>
      {/* Hidden from people; bots that fill every box get ignored */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input
        id="news-email" name="email" type="email" autoComplete="email" required
        placeholder="Your email address" defaultValue={state.values?.email}
        className="min-w-0 flex-[1_1_12rem] rounded-md border border-white/35 bg-transparent px-3.5 py-3 text-sm text-white placeholder:text-[#e4ece4]/60 transition focus:border-[#5cc66a] focus:outline-none"
        aria-invalid={!!state.errors?.email}
      />
      <button className="foot-subscribe group inline-flex flex-[0_0_auto] items-center justify-center gap-2 rounded-md bg-[#4fbf62] px-6 py-3 text-sm font-semibold text-[#0f2a1d] transition hover:bg-[#62d174] disabled:opacity-60" disabled={pending}>
        {pending ? "Subscribing…" : <>Subscribe <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg></>}
      </button>
      {state.errors?.email && <p className="w-full text-xs text-red-300">{state.errors.email}</p>}
    </form>
  );
}
