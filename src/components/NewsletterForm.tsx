"use client";

import { useActionState } from "react";
import { subscribe } from "@/modules/site/actions";
import type { FormState } from "@/lib/forms";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, {});
  if (state.ok) return <p className="foot-done rounded-2xl bg-white/10 px-4 py-3 text-sm text-lime-300">✓ {state.message}</p>;
  return (
    <form action={action} className="space-y-2" noValidate>
      <label htmlFor="news-email" className="sr-only">Your email address</label>
      {/* Hidden from people; bots that fill every box get ignored */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input
        id="news-email" name="email" type="email" autoComplete="email" required
        placeholder="Your email address" defaultValue={state.values?.email}
        className="w-full border-b border-white/30 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-mint-200/60 focus:border-lime-400 focus:outline-none"
        aria-invalid={!!state.errors?.email}
      />
      {state.errors?.email && <p className="text-xs text-red-300">{state.errors.email}</p>}
      <button className="foot-subscribe w-full rounded-full bg-lime-500 px-5 py-2.5 text-sm font-semibold text-forest-900 transition hover:bg-lime-400 disabled:opacity-60 sm:w-auto sm:px-8" disabled={pending}>
        {pending ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}
