"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminResetLink, adminTestEmail, login, register, requestPasswordReset, resetPassword } from "@/modules/accounts/actions";
import type { FormState } from "@/lib/forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" defaultValue={state.values?.email} required />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="field-label">Password</label>
          <Link href="/forgot-password" className="text-xs font-medium text-lime-700 hover:underline">Forgot password?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Logging in..." : "Log in"}</button>
      <p className="text-center text-sm text-stone-600">
        New here? <Link className="font-semibold text-lime-600" href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="name" className="field-label">Full name</label>
        <input id="name" name="name" className="input" autoComplete="name" defaultValue={state.values?.name} aria-invalid={!!e.name} />
        {e.name && <p className="field-error">{e.name}</p>}
      </div>
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" defaultValue={state.values?.email} aria-invalid={!!e.email} />
        {e.email && <p className="field-error">{e.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" aria-invalid={!!e.password} />
        <p className="hint">At least 8 characters, with letters and numbers.</p>
        {e.password && <p className="field-error">{e.password}</p>}
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Creating account..." : "Create account"}</button>
      <p className="text-center text-sm text-stone-600">
        Already registered? <Link className="font-semibold text-lime-600" href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint-100 text-2xl" aria-hidden="true">✉️</span>
        <p role="status" className="text-sm text-stone-700">{state.message}</p>
        <Link href="/login" className="btn-ghost w-full">Back to log in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" defaultValue={state.values?.email} aria-invalid={!!state.errors?.email} required />
        {state.errors?.email && <p className="field-error">{state.errors.email}</p>}
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</button>
      <p className="text-center text-sm text-stone-600">
        Remembered it? <Link className="font-semibold text-lime-600" href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.message && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {state.message} <Link href="/forgot-password" className="font-semibold underline">Get a new link</Link>
        </p>
      )}
      <div>
        <label htmlFor="password" className="field-label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" aria-invalid={!!e.password} />
        <p className="hint">At least 8 characters, with letters and numbers.</p>
        {e.password && <p className="field-error">{e.password}</p>}
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" aria-invalid={!!e.confirm} />
        {e.confirm && <p className="field-error">{e.confirm}</p>}
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving..." : "Save new password"}</button>
    </form>
  );
}

export function AdminResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(adminResetLink, {});
  return (
    <form action={action} className="space-y-3" noValidate>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="reset-email" className="sr-only">User&apos;s email</label>
        <input id="reset-email" name="email" type="email" placeholder="user@example.com" className="input min-w-0 flex-1" defaultValue={state.values?.email} />
        <button className="btn-primary" disabled={pending}>{pending ? "Making..." : "Make reset link"}</button>
      </div>
      {state.message && !state.ok && <p role="alert" className="field-error">{state.message}</p>}
      {state.ok && state.message && (
        <div className="rounded-xl bg-mint-50 p-3 text-sm">
          <p className="font-medium text-forest-900">Send this link to {state.values?.email}. It works once, for 30 minutes.</p>
          <input readOnly value={state.message} onFocus={(ev) => ev.currentTarget.select()} className="input mt-2 font-mono text-xs" aria-label="Reset link" />
        </div>
      )}
    </form>
  );
}

export function AdminTestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(adminTestEmail, {});
  return (
    <form action={action} className="space-y-3" noValidate>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="test-to" className="sr-only">Send a test to</label>
        <input id="test-to" name="to" type="email" className="input min-w-0 flex-1" defaultValue={state.values?.to ?? defaultTo} />
        <button className="btn-secondary" disabled={pending}>{pending ? "Sending..." : "Send test email"}</button>
      </div>
      {state.message && (
        <p role="status" className={`rounded-xl p-3 text-sm ${state.ok ? "bg-mint-50 text-forest-700" : "bg-red-50 text-red-800"}`}>{state.message}</p>
      )}
    </form>
  );
}
