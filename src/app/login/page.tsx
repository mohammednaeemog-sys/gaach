import { LoginForm } from "@/components/forms/AuthForms";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6">
        <h1 className="page-title mb-1">Log in</h1>
        <p className="mb-6 text-sm text-stone-600">Users and admins both log in here.</p>
        <LoginForm next={next} />
      </div>
      <p className="mt-4 text-center text-xs text-stone-500">
        {process.env.ADMIN_PASSWORD ? "Demo account: user@gaach.test / User1234" : "Demo accounts: user@gaach.test / User1234 and admin@gaach.test / Admin1234"}
      </p>
    </div>
  );
}
