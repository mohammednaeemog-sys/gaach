import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { deleteSite } from "@/modules/accounts/actions";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { label } from "@/lib/constants";

export const metadata = { title: "Profile and sites" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const user = await requireUser("/account");
  const { reset } = await searchParams;
  const sites = await db.site.findMany({ where: { userId: user.id }, include: { district: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {reset && <p role="status" className="rounded-2xl bg-mint-50 px-4 py-3 text-sm font-medium text-forest-700 lg:col-span-2">Your password was changed and you are logged in. Other devices were logged out.</p>}
      <section className="card p-5">
        <h1 className="page-title mb-4">Your profile</h1>
        <ProfileForm email={user.email} defaults={{ name: user.name, phone: user.phone ?? "", address: user.address ?? "" }} />
      </section>
      <section className="card p-5">
        <h2 className="mb-1 text-xl font-bold text-forest-900">Saved sites</h2>
        <p className="mb-4 text-sm text-stone-600">Save a site from the recommendation page, then reuse it any time.</p>
        {sites.length === 0 ? (
          <p className="text-sm text-stone-600">No saved sites yet. <Link href="/recommend" className="font-semibold text-lime-600">Find trees</Link> and save the site.</p>
        ) : (
          <ul className="space-y-2">
            {sites.map((s) => {
              const q = new URLSearchParams({ divisionId: String(s.district.divisionId), districtId: String(s.districtId), spaceM: String(s.spaceM), sunlight: s.sunlight, soil: s.soil, purpose: s.purpose });
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 p-3">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-stone-500">{s.district.name} · {s.spaceM} m · {label(s.sunlight)} · {label(s.soil)} · {label(s.purpose)}</p>
                  </div>
                  <Link href={`/recommend?${q}`} className="btn-secondary px-3 py-1.5 text-xs">Recommend</Link>
                  <form action={deleteSite}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-ghost px-2 text-xs text-red-700">Delete</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
