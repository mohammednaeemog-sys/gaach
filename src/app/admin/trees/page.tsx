import Link from "next/link";
import { db } from "@/lib/db";
import { setTreePublished } from "@/modules/admin/actions";
import { missingForPublish } from "@/modules/admin/validation";

export const metadata = { title: "Trees" };

export default async function AdminTrees({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const trees = await db.tree.findMany({ orderBy: { name: "asc" }, include: { products: true, _count: { select: { careStages: true } } } });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="page-title">Trees and products</h1>
        <Link href="/admin/trees/new" className="btn-primary">+ New tree</Link>
      </div>
      {deleted && <p className="mb-3 rounded-lg bg-mint-50 p-3 text-sm text-forest-700">Tree deleted.</p>}
      <div className="card overflow-x-auto">
        <table className="table min-w-[40rem]">
          <thead><tr><th>Tree</th><th>Status</th><th>Products</th><th>Stock</th><th>Care stages</th><th></th></tr></thead>
          <tbody>
            {trees.map((t) => {
              const missing = missingForPublish(t);
              return (
                <tr key={t.id}>
                  <td><Link href={`/admin/trees/${t.id}`} className="font-medium text-forest-700 hover:underline">{t.name}</Link><div className="text-xs text-stone-500">{t.banglaName}</div></td>
                  <td>{t.published ? <span className="chip">Published</span> : <span className="chip-muted">Draft</span>}{!t.published && missing.length > 0 && <div className="text-xs text-amber-700">{missing.length} fields missing</div>}</td>
                  <td>{t.products.length}</td>
                  <td>{t.products.reduce((s, p) => s + p.stock, 0)}</td>
                  <td>{t._count.careStages}/4</td>
                  <td className="text-right">
                    <form action={setTreePublished}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="publish" value={t.published ? "0" : "1"} />
                      <button className="btn-ghost px-2 py-1 text-xs">{t.published ? "Unpublish" : "Publish"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
