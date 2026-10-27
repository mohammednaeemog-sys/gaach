import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Photo credits" };

export default async function CreditsPage() {
  const trees = await db.tree.findMany({ where: { published: true, imageUrl: { not: null } }, orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Photo credits</h1>
      <p className="mt-2 text-sm text-stone-600">
        Tree photos come from Wikimedia Commons under open licenses (Creative Commons or public domain), or were provided by Gaach. Thank you to the photographers.
      </p>
      {trees.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-stone-600">No photos have been added yet.</p>
      ) : (
        <ul className="card mt-6 divide-y divide-stone-100">
          {trees.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.imageUrl!} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
              <div className="min-w-0 flex-1 text-sm">
                <Link href={`/trees/${t.slug}`} className="font-medium text-forest-900 hover:text-lime-600">{t.name}</Link>
                <p className="truncate text-xs text-stone-500">
                  {t.imageSourceUrl ? <a href={t.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{t.imageCredit || "Source"}</a> : t.imageCredit || "Photo provided by Gaach"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
