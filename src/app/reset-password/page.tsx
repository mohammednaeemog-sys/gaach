import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/AuthForms";
import { findValidReset } from "@/modules/accounts/reset";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const reset = await findValidReset(token);
  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6">
        {reset ? (
          <>
            <h1 className="page-title mb-1">Choose a new password</h1>
            <p className="mb-6 text-sm text-stone-600">For {reset.user.email}</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <h1 className="page-title mb-1">This link doesn&apos;t work</h1>
            <p className="mb-6 text-sm text-stone-600">It may have expired (links last 30 minutes) or already been used.</p>
            <Link href="/forgot-password" className="btn-primary w-full">Get a new link</Link>
          </>
        )}
      </div>
    </div>
  );
}
