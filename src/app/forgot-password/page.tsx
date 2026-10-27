import { ForgotPasswordForm } from "@/components/forms/AuthForms";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6">
        <h1 className="page-title mb-1">Forgot your password?</h1>
        <p className="mb-6 text-sm text-stone-600">Type the email you signed up with. We&apos;ll email you a link to choose a new password.</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
