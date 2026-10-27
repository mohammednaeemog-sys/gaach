import { RegisterForm } from "@/components/forms/AuthForms";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6">
        <h1 className="page-title mb-1">Create your account</h1>
        <p className="mb-6 text-sm text-stone-600">Save your planting sites, buy saplings and get care plans for them.</p>
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
